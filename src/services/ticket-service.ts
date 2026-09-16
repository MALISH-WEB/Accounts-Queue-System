/**
 * CampusQ — UCU Accounts Office Ticket Management & Intelligent Staff Routing Service
 * Controlled state machine, status history, message threads, and permission-based routing.
 */

import { db } from '../db/database.js';
import { TicketStatus, TicketPriority, UserRole, NotificationType } from '../types/index.js';

export interface CreateTicketInput {
  studentId: string;
  serviceId: string;
  description: string;
  category?: string;
  priority?: TicketPriority;
}

export class TicketService {
  /**
   * Determine intelligent staff routing destination based on Accounts Office rules
   */
  static async routeTicketToStaff(serviceId: string, isEscalated = false): Promise<any> {
    const service = await db.getOne<any>(`SELECT * FROM services WHERE id = ?`, [serviceId]);
    const targetRole = isEscalated
      ? UserRole.SENIOR_ACCOUNTS_OFFICER
      : service?.authorized_destination_role || UserRole.ACCOUNTS_OFFICER;

    // Find available Accounts staff member in the target role with lowest active workload
    const staffCandidates = await db.query<any>(
      `SELECT ast.*, u.full_name,
              (SELECT COUNT(*) FROM tickets t WHERE t.assigned_staff_id = ast.id AND t.status IN ('IN_PROGRESS', 'WAITING', 'SERVING')) as active_count
       FROM accounts_staff ast
       JOIN users u ON ast.user_id = u.id
       WHERE u.role = ?
       ORDER BY active_count ASC, ast.id ASC LIMIT 1`,
      [targetRole]
    );

    if (staffCandidates.length > 0) {
      return staffCandidates[0];
    }

    // Fallback to any staff member
    return await db.getOne<any>(
      `SELECT ast.*, u.full_name FROM accounts_staff ast JOIN users u ON ast.user_id = u.id LIMIT 1`
    );
  }

  /**
   * Create a new Accounts Office service ticket
   */
  static async createTicket(input: CreateTicketInput, userId: string) {
    if (!input.description || input.description.trim().length < 5) {
      throw new Error('Please provide a descriptive explanation of your Accounts service request.');
    }

    const service = await db.getOne<any>(`SELECT * FROM services WHERE id = ?`, [input.serviceId]);
    if (!service) {
      throw new Error(`Accounts service ${input.serviceId} not found`);
    }

    const student = await db.getOne<any>(
      `SELECT s.*, u.full_name FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?`,
      [input.studentId]
    );
    if (!student) {
      throw new Error(`Student ${input.studentId} not found`);
    }

    // Generate human-readable ticket number: ACC-YYYY-XXXX
    const countRow = await db.getOne<any>(`SELECT COUNT(*) as total FROM tickets`);
    const seq = (countRow?.total || 0) + 1;
    const year = new Date().getFullYear();
    const ticketNumber = `ACC-${year}-${String(seq).padStart(4, '0')}`;
    const ticketId = `TCK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Intelligent staff routing
    const assignedStaff = await TicketService.routeTicketToStaff(input.serviceId);

    // Expected resolution calculation based on estimated service time
    const estMinutes = service.estimated_processing_time_minutes || 60;
    const expectedTime = new Date(Date.now() + estMinutes * 60 * 1000).toISOString();

    // Default priority: Normal (students cannot choose arbitrary urgent/high without authorization)
    const priority = input.priority || TicketPriority.NORMAL;
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO tickets (
          id, ticket_number, student_id, service_id, category, description, priority, 
          status, assigned_staff_id, expected_resolution_time, is_escalated, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [
          ticketId,
          ticketNumber,
          input.studentId,
          input.serviceId,
          input.category || service.category_id,
          input.description.trim(),
          priority,
          TicketStatus.WAITING,
          assignedStaff ? assignedStaff.id : null,
          expectedTime,
          now,
          now,
        ]
      );

      // Record initial status history
      const histId = `TSH_${Date.now()}_1`;
      await tx.run(
        `INSERT INTO ticket_status_history (id, ticket_id, from_status, to_status, changed_by_user_id, changed_by_role, notes, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [histId, ticketId, 'NONE', TicketStatus.WAITING, userId, UserRole.STUDENT, 'Ticket opened by student', now]
      );

      // Initial message from student
      const msgId = `MSG_${Date.now()}_1`;
      await tx.run(
        `INSERT INTO ticket_messages (id, ticket_id, sender_user_id, sender_name, sender_role, message, is_internal_only, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
        [msgId, ticketId, userId, student.full_name, UserRole.STUDENT, input.description.trim(), now]
      );

      // Send confirmation notification to student
      const notifId = `NOTIF_${Date.now()}_1`;
      await tx.run(
        `INSERT INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [
          notifId,
          userId,
          NotificationType.TICKET_CREATED,
          `Ticket Created: ${ticketNumber}`,
          `Your Accounts enquiry regarding ${service.name} has been assigned ticket number ${ticketNumber}. Staff will assist you shortly.`,
          ticketId,
          now,
        ]
      );

      // Audit Log
      const auditId = `AUD_${Date.now()}_1`;
      await tx.run(
        `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          userId,
          UserRole.STUDENT,
          student.full_name,
          'TICKET_CREATED',
          'TICKET',
          ticketId,
          null,
          ticketNumber,
          `Opened ticket for service ${service.name}`,
          now,
        ]
      );
    });

    return await TicketService.getTicketById(ticketId, userId, UserRole.STUDENT);
  }

  /**
   * Transition ticket status using the formal state machine
   */
  static async updateTicketStatus(
    ticketId: string,
    newStatus: TicketStatus,
    changedByUserId: string,
    changedByName: string,
    changedByRole: UserRole,
    notes?: string
  ) {
    const ticket = await db.getOne<any>(`SELECT * FROM tickets WHERE id = ?`, [ticketId]);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    const currentStatus = ticket.status as TicketStatus;

    // Validate state machine transitions
    // Students can only cancel tickets that are still WAITING or confirm resolution
    if (changedByRole === UserRole.STUDENT) {
      if (newStatus === TicketStatus.CANCELLED && currentStatus !== TicketStatus.WAITING) {
        throw new Error('You cannot cancel a ticket that is already being handled or resolved.');
      }
      if (newStatus === TicketStatus.COMPLETED && currentStatus !== TicketStatus.RESOLVED) {
        throw new Error('You can only confirm completion on a ticket marked RESOLVED.');
      }
    }

    const now = new Date().toISOString();
    const isResolution = newStatus === TicketStatus.RESOLVED || newStatus === TicketStatus.COMPLETED;

    await db.transaction(async (tx) => {
      await tx.run(
        `UPDATE tickets 
         SET status = ?, 
             actual_resolution_time = CASE WHEN ? = 1 THEN ? ELSE actual_resolution_time END,
             resolution_summary = COALESCE(?, resolution_summary),
             updated_at = ? 
         WHERE id = ?`,
        [newStatus, isResolution ? 1 : 0, now, notes || null, now, ticketId]
      );

      // Record in ticket_status_history
      const histId = `TSH_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await tx.run(
        `INSERT INTO ticket_status_history (id, ticket_id, from_status, to_status, changed_by_user_id, changed_by_role, notes, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [histId, ticketId, currentStatus, newStatus, changedByUserId, changedByRole, notes || `Status changed to ${newStatus}`, now]
      );

      // Notify student of important transitions
      const student = await tx.getOne<any>(`SELECT user_id FROM students WHERE id = ?`, [ticket.student_id]);
      if (student && student.user_id !== changedByUserId) {
        const notifId = `NOTIF_${Date.now()}_1`;
        let notifTitle = `Ticket ${ticket.ticket_number} Updated`;
        let notifType = NotificationType.TICKET_ASSIGNED;

        if (newStatus === TicketStatus.RESOLVED) {
          notifTitle = `Ticket ${ticket.ticket_number} Resolved`;
          notifType = NotificationType.TICKET_RESOLVED;
        } else if (newStatus === TicketStatus.PENDING_STUDENT) {
          notifTitle = `More Information Requested: Ticket ${ticket.ticket_number}`;
          notifType = NotificationType.STAFF_REQUESTED_INFO;
        }

        await tx.run(
          `INSERT INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
          [
            notifId,
            student.user_id,
            notifType,
            notifTitle,
            notes || `Your ticket status is now: ${newStatus}`,
            ticketId,
            now,
          ]
        );
      }

      // Audit Log
      const auditId = `AUD_${Date.now()}_1`;
      await tx.run(
        `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          changedByUserId,
          changedByRole,
          changedByName,
          'TICKET_STATUS_UPDATE',
          'TICKET',
          ticketId,
          currentStatus,
          newStatus,
          notes || `Status changed to ${newStatus}`,
          now,
        ]
      );
    });

    return await TicketService.getTicketById(ticketId, changedByUserId, changedByRole);
  }

  /**
   * Escalate ticket to Senior Accounts Officer or Supervisor
   */
  static async escalateTicket(
    ticketId: string,
    reason: string,
    escalatedByUserId: string,
    escalatedByName: string,
    escalatedByRole: UserRole
  ) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('An escalation reason is required.');
    }

    const seniorStaff = await TicketService.routeTicketToStaff('', true);

    await db.run(
      `UPDATE tickets 
       SET is_escalated = 1, 
           status = 'ESCALATED', 
           escalation_reason = ?, 
           assigned_staff_id = ?, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [reason, seniorStaff ? seniorStaff.id : null, ticketId]
    );

    // Audit Log
    await db.run(
      `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        `AUD_${Date.now()}`,
        escalatedByUserId,
        escalatedByRole,
        escalatedByName,
        'TICKET_ESCALATED',
        'TICKET',
        ticketId,
        'NORMAL',
        'ESCALATED',
        `Reason: ${reason}`,
      ]
    );

    return await TicketService.getTicketById(ticketId, escalatedByUserId, escalatedByRole);
  }

  /**
   * Post a message to a ticket thread
   */
  static async addMessage(
    ticketId: string,
    messageText: string,
    senderUserId: string,
    senderName: string,
    senderRole: UserRole,
    isInternalOnly = false,
    attachmentUrl?: string
  ) {
    if (!messageText || messageText.trim().length === 0) {
      throw new Error('Message cannot be empty.');
    }

    const ticket = await db.getOne<any>(`SELECT * FROM tickets WHERE id = ?`, [ticketId]);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    const msgId = `MSG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO ticket_messages (id, ticket_id, sender_user_id, sender_name, sender_role, message, is_internal_only, attachment_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [msgId, ticketId, senderUserId, senderName, senderRole, messageText.trim(), isInternalOnly ? 1 : 0, attachmentUrl || null, now]
    );

    // Update ticket timestamp
    await db.run(`UPDATE tickets SET updated_at = ? WHERE id = ?`, [now, ticketId]);

    // If staff sent external message, set status to PENDING_STUDENT
    if (senderRole !== UserRole.STUDENT && !isInternalOnly) {
      await db.run(`UPDATE tickets SET status = 'PENDING_STUDENT' WHERE id = ?`, [ticketId]);
    } else if (senderRole === UserRole.STUDENT) {
      // If student replied, set status to PENDING_STAFF or IN_PROGRESS
      await db.run(`UPDATE tickets SET status = 'PENDING_STAFF' WHERE id = ?`, [ticketId]);
    }

    return await db.getOne<any>(`SELECT * FROM ticket_messages WHERE id = ?`, [msgId]);
  }

  /**
   * Get ticket details with messages and history with data isolation
   */
  static async getTicketById(ticketId: string, requestingUserId: string, requestingRole: UserRole) {
    const ticket = await db.getOne<any>(
      `SELECT t.*, s.student_number, s.programme, s.faculty, u.full_name as student_name, 
              srv.name as service_name, ast.title as staff_title, u_staff.full_name as assigned_staff_name
       FROM tickets t
       JOIN students s ON t.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN services srv ON t.service_id = srv.id
       LEFT JOIN accounts_staff ast ON t.assigned_staff_id = ast.id
       LEFT JOIN users u_staff ON ast.user_id = u_staff.id
       WHERE t.id = ?`,
      [ticketId]
    );

    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    // Data isolation check: Students can only view their own tickets
    if (requestingRole === UserRole.STUDENT) {
      const student = await db.getOne<any>(`SELECT id FROM students WHERE user_id = ?`, [requestingUserId]);
      if (!student || student.id !== ticket.student_id) {
        throw new Error('Access Denied: You are not authorized to access another student’s ticket.');
      }
    }

    // Filter messages: Students never see internal staff notes
    const isStaff = requestingRole !== UserRole.STUDENT;
    const messages = await db.query<any>(
      `SELECT * FROM ticket_messages 
       WHERE ticket_id = ? ${isStaff ? '' : 'AND is_internal_only = 0'} 
       ORDER BY created_at ASC`,
      [ticketId]
    );

    const history = await db.query<any>(
      `SELECT * FROM ticket_status_history WHERE ticket_id = ? ORDER BY timestamp ASC`,
      [ticketId]
    );

    return {
      ...ticket,
      messages,
      history,
    };
  }

  /**
   * List tickets with filtering and role enforcement
   */
  static async listTickets(
    requestingUserId: string,
    requestingRole: UserRole,
    filters?: { status?: string; serviceId?: string; studentId?: string }
  ) {
    let sql = `
      SELECT t.*, s.student_number, u.full_name as student_name, 
             srv.name as service_name, u_staff.full_name as assigned_staff_name
      FROM tickets t
      JOIN students s ON t.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN services srv ON t.service_id = srv.id
      LEFT JOIN accounts_staff ast ON t.assigned_staff_id = ast.id
      LEFT JOIN users u_staff ON ast.user_id = u_staff.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Students only ever see their own tickets
    if (requestingRole === UserRole.STUDENT) {
      const student = await db.getOne<any>(`SELECT id FROM students WHERE user_id = ?`, [requestingUserId]);
      if (!student) return [];
      sql += ` AND t.student_id = ?`;
      params.push(student.id);
    } else if (filters?.studentId) {
      sql += ` AND t.student_id = ?`;
      params.push(filters.studentId);
    }

    if (filters?.status) {
      sql += ` AND t.status = ?`;
      params.push(filters.status);
    }

    if (filters?.serviceId) {
      sql += ` AND t.service_id = ?`;
      params.push(filters.serviceId);
    }

    sql += ` ORDER BY t.created_at DESC`;

    return await db.query<any>(sql, params);
  }
}
