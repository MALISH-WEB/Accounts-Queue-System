/**
 * CampusQ — UCU Accounts Office Appointment Management Service
 * Working hours, slot conflict checks, remote (Google Meet) vs physical counter appointments.
 */

import { db } from '../db/database.js';
import { AppointmentStatus, AppointmentType, NotificationType, UserRole } from '../types/index.js';

export const WORKING_HOURS_SLOTS = [
  '09:00 - 09:30',
  '09:30 - 10:00',
  '10:00 - 10:30',
  '10:30 - 11:00',
  '11:00 - 11:30',
  '11:30 - 12:00',
  '14:00 - 14:30',
  '14:30 - 15:00',
  '15:00 - 15:30',
  '15:30 - 16:00',
];

export interface BookAppointmentInput {
  studentId: string;
  serviceId: string;
  staffId?: string;
  appointmentType: AppointmentType;
  scheduledDate: string; // YYYY-MM-DD
  timeSlot: string;
  reason: string;
}

export class AppointmentService {
  /**
   * Get available time slots for a given date and staff member
   */
  static async getAvailableSlots(date: string, staffId?: string) {
    let sql = `SELECT time_slot FROM appointments WHERE scheduled_date = ? AND status IN ('SCHEDULED', 'CONFIRMED')`;
    const params: any[] = [date];

    if (staffId) {
      sql += ` AND staff_id = ?`;
      params.push(staffId);
    }

    const bookedRows = await db.query<any>(sql, params);
    const bookedSlots = new Set(bookedRows.map((r) => r.time_slot));

    return WORKING_HOURS_SLOTS.map((slot) => ({
      timeSlot: slot,
      isAvailable: !bookedSlots.has(slot),
    }));
  }

  /**
   * Book an appointment with Accounts Office staff
   */
  static async bookAppointment(input: BookAppointmentInput, userId: string) {
    if (!input.reason || input.reason.trim().length < 5) {
      throw new Error('Please provide the reason for your Accounts Office appointment.');
    }

    if (!WORKING_HOURS_SLOTS.includes(input.timeSlot)) {
      throw new Error(`Invalid time slot selected. Available slots: ${WORKING_HOURS_SLOTS.join(', ')}`);
    }

    // Check slot conflict
    const conflict = await db.getOne<any>(
      `SELECT id FROM appointments 
       WHERE scheduled_date = ? AND time_slot = ? AND status IN ('SCHEDULED', 'CONFIRMED') ${input.staffId ? 'AND staff_id = ?' : ''}`,
      input.staffId ? [input.scheduledDate, input.timeSlot, input.staffId] : [input.scheduledDate, input.timeSlot]
    );

    if (conflict) {
      throw new Error('The selected appointment time slot has just been booked. Please select another slot.');
    }

    // Check if student already has a pending appointment on the same day
    const existing = await db.getOne<any>(
      `SELECT id FROM appointments WHERE student_id = ? AND scheduled_date = ? AND status IN ('SCHEDULED', 'CONFIRMED')`,
      [input.studentId, input.scheduledDate]
    );
    if (existing) {
      throw new Error('You already have an appointment booked on this date. Multiple bookings on the same day are not allowed.');
    }

    // Pick available staff if none specified
    let targetStaffId = input.staffId;
    if (!targetStaffId) {
      const staffRow = await db.getOne<any>(`SELECT id FROM accounts_staff LIMIT 1`);
      targetStaffId = staffRow?.id;
    }

    const staff = await db.getOne<any>(
      `SELECT ast.*, u.full_name FROM accounts_staff ast JOIN users u ON ast.user_id = u.id WHERE ast.id = ?`,
      [targetStaffId]
    );

    const student = await db.getOne<any>(
      `SELECT s.*, u.id as user_id, u.full_name FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?`,
      [input.studentId]
    );

    // Numbering format: ACC-APT-YYYY-XXXX
    const countRow = await db.getOne<any>(`SELECT COUNT(*) as total FROM appointments`);
    const seq = (countRow?.total || 0) + 1;
    const year = new Date().getFullYear();
    const appointmentNumber = `ACC-APT-${year}-${String(seq).padStart(4, '0')}`;
    const appointmentId = `APT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const locationOrLink =
      input.appointmentType === AppointmentType.REMOTE
        ? 'https://meet.google.com/ucu-acc-officer'
        : staff?.assigned_counter || 'Accounts Office — Reception Desk';

    await db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO appointments (
          id, appointment_number, student_id, service_id, staff_id, appointment_type, 
          scheduled_date, time_slot, status, meeting_link_or_counter, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          appointmentId,
          appointmentNumber,
          input.studentId,
          input.serviceId,
          targetStaffId,
          input.appointmentType,
          input.scheduledDate,
          input.timeSlot,
          AppointmentStatus.SCHEDULED,
          locationOrLink,
          input.reason.trim(),
        ]
      );

      // Send notification to student
      const notifId = `NOTIF_${Date.now()}_1`;
      await tx.run(
        `INSERT INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
        [
          notifId,
          student.user_id,
          NotificationType.APPOINTMENT_BOOKED,
          `Appointment Scheduled: ${appointmentNumber}`,
          `Your ${input.appointmentType} appointment is confirmed for ${input.scheduledDate} at ${input.timeSlot} with ${staff?.full_name || 'Accounts Staff'}. Location/Link: ${locationOrLink}`,
          appointmentId,
        ]
      );

      // Audit Log
      const auditId = `AUD_${Date.now()}_1`;
      await tx.run(
        `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          auditId,
          userId,
          UserRole.STUDENT,
          student.full_name,
          'APPOINTMENT_BOOKED',
          'APPOINTMENT',
          appointmentId,
          null,
          appointmentNumber,
          `Booked ${input.appointmentType} appointment for ${input.scheduledDate} ${input.timeSlot}`,
        ]
      );
    });

    return await db.getOne<any>(`SELECT * FROM appointments WHERE id = ?`, [appointmentId]);
  }

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(appointmentId: string, userId: string, userRole: UserRole) {
    const apt = await db.getOne<any>(
      `SELECT a.*, s.user_id as student_user_id FROM appointments a JOIN students s ON a.student_id = s.id WHERE a.id = ?`,
      [appointmentId]
    );
    if (!apt) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    if (userRole === UserRole.STUDENT && apt.student_user_id !== userId) {
      throw new Error('Access Denied: You cannot cancel another student’s appointment.');
    }

    await db.run(`UPDATE appointments SET status = ? WHERE id = ?`, [AppointmentStatus.CANCELLED, appointmentId]);

    return { success: true, message: 'Appointment cancelled.' };
  }

  /**
   * List appointments with data isolation
   */
  static async listAppointments(requestingUserId: string, requestingRole: UserRole) {
    let sql = `
      SELECT a.*, s.student_number, u_stu.full_name as student_name, 
             srv.name as service_name, u_staff.full_name as staff_name, ast.assigned_counter
      FROM appointments a
      JOIN students s ON a.student_id = s.id
      JOIN users u_stu ON s.user_id = u_stu.id
      JOIN services srv ON a.service_id = srv.id
      LEFT JOIN accounts_staff ast ON a.staff_id = ast.id
      LEFT JOIN users u_staff ON ast.user_id = u_staff.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (requestingRole === UserRole.STUDENT) {
      const student = await db.getOne<any>(`SELECT id FROM students WHERE user_id = ?`, [requestingUserId]);
      if (!student) return [];
      sql += ` AND a.student_id = ?`;
      params.push(student.id);
    }

    sql += ` ORDER BY a.scheduled_date DESC, a.time_slot ASC`;
    return await db.query<any>(sql, params);
  }
}
