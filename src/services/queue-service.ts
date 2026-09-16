/**
 * CampusQ — UCU Accounts Office Intelligent Virtual Queue Management Service
 * Physical visit avoidance, strict FIFO ordering, live counter display, and wait time estimation.
 */

import { db } from '../db/database.js';
import { QueueStatus, TicketPriority, UserRole, NotificationType } from '../types/index.js';

export class QueueService {
  /**
   * Check if a student is eligible to join the virtual queue
   */
  static async checkQueueEligibility(serviceId: string, studentId: string) {
    const service = await db.getOne<any>(`SELECT * FROM services WHERE id = ?`, [serviceId]);
    if (!service) {
      throw new Error('Selected Accounts service does not exist.');
    }

    // Rule: Virtual Queue is only available for services that require real-time physical/counter interaction
    // Services that can be completed fully online (e.g. Balance Inquiry, Milestone Tracking, Receipt Request)
    // should not generate queue passes.
    if (service.is_self_service_supported && !service.is_queue_required) {
      return {
        isEligible: false,
        reason: `${service.name} is fully automated and can be completed instantly online via self-service. Joining a physical queue is not required.`,
      };
    }

    // Check duplicate active queue entries
    const activeEntry = await db.getOne<any>(
      `SELECT * FROM queue_entries 
       WHERE student_id = ? AND status IN ('WAITING', 'CALLED', 'SERVING')`,
      [studentId]
    );

    if (activeEntry) {
      return {
        isEligible: false,
        reason: `You already have an active queue ticket (${activeEntry.queue_number}). Multiple concurrent queue passes are prohibited.`,
        activeEntry,
      };
    }

    return {
      isEligible: true,
      service,
    };
  }

  /**
   * Join the virtual queue
   */
  static async joinQueue(
    studentId: string,
    serviceId: string,
    priority: TicketPriority = TicketPriority.NORMAL,
    ticketId?: string
  ) {
    const eligibility = await QueueService.checkQueueEligibility(serviceId, studentId);
    if (!eligibility.isEligible) {
      throw new Error(eligibility.reason);
    }

    const student = await db.getOne<any>(
      `SELECT s.*, u.id as user_id, u.full_name FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?`,
      [studentId]
    );
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    // Calculate current position in FIFO queue
    const waitingCountRow = await db.getOne<any>(
      `SELECT COUNT(*) as count FROM queue_entries WHERE status = 'WAITING'`
    );
    const position = (waitingCountRow?.count || 0) + 1;

    // Generate queue ticket number: ACC-Q-YYYY-XXXX or ACAD-STAMP-YYYY-XXXX
    const countRow = await db.getOne<any>(`SELECT COUNT(*) as total FROM queue_entries`);
    const seq = (countRow?.total || 0) + 1;
    const year = new Date().getFullYear();
    const isAcademicStamp = serviceId === 'SRV_ACAD_STAMP';
    const queueNumber = isAcademicStamp
      ? `ACAD-STAMP-${year}-${String(seq).padStart(4, '0')}`
      : `ACC-Q-${year}-${String(seq).padStart(4, '0')}`;
    const queueEntryId = `Q_ENT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Calculate estimated wait time (5-8 min per waiting position ahead)
    const estimatedWaitMinutes = Math.max(5, (position - 1) * 8);

    await db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO queue_entries (
          id, queue_number, student_id, service_id, ticket_id, priority, status, 
          position, estimated_wait_minutes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          queueEntryId,
          queueNumber,
          studentId,
          serviceId,
          ticketId || null,
          priority,
          QueueStatus.WAITING,
          position,
          estimatedWaitMinutes,
        ]
      );

      // Record service request log for analytics
      const srvReqId = `SRV_REQ_${Date.now()}`;
      await tx.run(
        `INSERT INTO service_requests (id, student_id, service_id, resolution_type, status, created_at)
         VALUES (?, ?, ?, 'VIRTUAL_QUEUE', 'QUEUED', CURRENT_TIMESTAMP)`,
        [srvReqId, studentId, serviceId]
      );

      // Send notification to student
      const notifId = `NOTIF_${Date.now()}_1`;
      await tx.run(
        `INSERT INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
        [
          notifId,
          student.user_id,
          NotificationType.QUEUE_JOINED,
          `Queue Pass Issued: ${queueNumber}`,
          `You have joined the virtual queue at Position #${position}. Estimated wait: ~${estimatedWaitMinutes} minutes. You will receive an alert when called to a counter.`,
          queueEntryId,
        ]
      );
    });

    return await db.getOne<any>(`SELECT * FROM queue_entries WHERE id = ?`, [queueEntryId]);
  }

  /**
   * Accounts staff calls next student in queue (FIFO with priority consideration)
   */
  static async callNextStudent(staffId: string, counterName: string, staffUserId: string, staffName: string) {
    // Retrieve highest priority, earliest waiting queue entry (FIFO)
    const nextEntry = await db.getOne<any>(
      `SELECT qe.*, s.student_number, u.full_name as student_name, u.id as user_id, srv.name as service_name
       FROM queue_entries qe
       JOIN students s ON qe.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN services srv ON qe.service_id = srv.id
       WHERE qe.status = 'WAITING'
       ORDER BY 
         CASE qe.priority 
           WHEN 'URGENT' THEN 1 
           WHEN 'HIGH' THEN 2 
           WHEN 'NORMAL' THEN 3 
           ELSE 4 
         END ASC,
         qe.created_at ASC
       LIMIT 1`
    );

    if (!nextEntry) {
      return null; // No students waiting
    }

    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      // Update queue entry
      await tx.run(
        `UPDATE queue_entries 
         SET status = ?, 
             assigned_counter = ?, 
             assigned_staff_id = ?, 
             called_at = ?, 
             position = 0 
         WHERE id = ?`,
        [QueueStatus.CALLED, counterName, staffId, now, nextEntry.id]
      );

      // Re-index remaining waiting queue positions
      const waitingList = await tx.query<any>(
        `SELECT id FROM queue_entries WHERE status = 'WAITING' ORDER BY created_at ASC`
      );
      for (let i = 0; i < waitingList.length; i++) {
        const newPos = i + 1;
        const newWait = (newPos - 1) * 10;
        await tx.run(
          `UPDATE queue_entries SET position = ?, estimated_wait_minutes = ? WHERE id = ?`,
          [newPos, newWait, waitingList[i].id]
        );
      }

      // Update counter current serving ticket
      await tx.run(
        `UPDATE counters SET current_serving_ticket = ?, staff_id = ? WHERE name = ?`,
        [nextEntry.queue_number, staffId, counterName]
      );

      // Notify the called student
      const notifId = `NOTIF_${Date.now()}_1`;
      await tx.run(
        `INSERT INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
        [
          notifId,
          nextEntry.user_id,
          NotificationType.QUEUE_CALLED,
          `NOW CALLING: Ticket ${nextEntry.queue_number}`,
          `Please proceed immediately to ${counterName}. Staff member ${staffName} is ready to assist you.`,
          nextEntry.id,
        ]
      );

      // Audit Log
      const auditId = `AUD_${Date.now()}_1`;
      await tx.run(
        `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          auditId,
          staffUserId,
          UserRole.ACCOUNTS_OFFICER,
          staffName,
          'QUEUE_STUDENT_CALLED',
          'QUEUE_ENTRY',
          nextEntry.id,
          'WAITING',
          'CALLED',
          `Called ticket ${nextEntry.queue_number} to ${counterName}`,
        ]
      );
    });

    return await db.getOne<any>(`SELECT * FROM queue_entries WHERE id = ?`, [nextEntry.id]);
  }

  /**
   * Start serving the student at the counter
   */
  static async startServing(queueEntryId: string) {
    const now = new Date().toISOString();
    await db.run(
      `UPDATE queue_entries SET status = ?, served_at = ? WHERE id = ?`,
      [QueueStatus.SERVING, now, queueEntryId]
    );
    return await db.getOne<any>(`SELECT * FROM queue_entries WHERE id = ?`, [queueEntryId]);
  }

  /**
   * Complete counter service
   */
  static async completeService(queueEntryId: string, counterName?: string) {
    const now = new Date().toISOString();
    await db.run(
      `UPDATE queue_entries SET status = ?, completed_at = ? WHERE id = ?`,
      [QueueStatus.COMPLETED, now, queueEntryId]
    );

    if (counterName) {
      await db.run(
        `UPDATE counters SET current_serving_ticket = NULL WHERE name = ?`,
        [counterName]
      );
    }

    return await db.getOne<any>(`SELECT * FROM queue_entries WHERE id = ?`, [queueEntryId]);
  }

  /**
   * Skip a student who did not appear after being called
   */
  static async skipStudent(queueEntryId: string) {
    await db.run(`UPDATE queue_entries SET status = ? WHERE id = ?`, [QueueStatus.SKIPPED, queueEntryId]);
    return await db.getOne<any>(`SELECT * FROM queue_entries WHERE id = ?`, [queueEntryId]);
  }

  /**
   * Cancel queue entry (student voluntarily leaves queue)
   */
  static async cancelQueueEntry(queueEntryId: string, userId: string) {
    const entry = await db.getOne<any>(
      `SELECT qe.*, s.user_id FROM queue_entries qe JOIN students s ON qe.student_id = s.id WHERE qe.id = ?`,
      [queueEntryId]
    );

    if (!entry) {
      throw new Error(`Queue entry ${queueEntryId} not found`);
    }

    if (entry.user_id !== userId) {
      throw new Error('Access Denied: You cannot cancel another student’s queue pass.');
    }

    await db.run(`UPDATE queue_entries SET status = ? WHERE id = ?`, [QueueStatus.CANCELLED, queueEntryId]);

    // Re-index remaining positions
    const waitingList = await db.query<any>(
      `SELECT id FROM queue_entries WHERE status = 'WAITING' ORDER BY created_at ASC`
    );
    for (let i = 0; i < waitingList.length; i++) {
      await db.run(
        `UPDATE queue_entries SET position = ?, estimated_wait_minutes = ? WHERE id = ?`,
        [i + 1, i * 10, waitingList[i].id]
      );
    }

    return { success: true, message: 'Queue ticket cancelled successfully.' };
  }

  /**
   * Get active queue status for live counter display / TV monitor
   */
  static async getLiveQueueState() {
    const activeCounters = await db.query<any>(
      `SELECT c.*, ast.title as staff_title, u.full_name as staff_name 
       FROM counters c
       LEFT JOIN accounts_staff ast ON c.staff_id = ast.id
       LEFT JOIN users u ON ast.user_id = u.id
       WHERE c.is_active = 1`
    );

    const nowServing = await db.query<any>(
      `SELECT qe.*, srv.name as service_name, s.student_number 
       FROM queue_entries qe
       JOIN services srv ON qe.service_id = srv.id
       JOIN students s ON qe.student_id = s.id
       WHERE qe.status IN ('CALLED', 'SERVING')
       ORDER BY qe.called_at DESC`
    );

    const waitingQueue = await db.query<any>(
      `SELECT qe.queue_number, qe.position, qe.estimated_wait_minutes, srv.name as service_name, qe.priority
       FROM queue_entries qe
       JOIN services srv ON qe.service_id = srv.id
       WHERE qe.status = 'WAITING'
       ORDER BY qe.position ASC`
    );

    return {
      activeCounters,
      nowServing,
      waitingQueue,
      totalWaiting: waitingQueue.length,
    };
  }
}
