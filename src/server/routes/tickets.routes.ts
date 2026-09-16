import { Router } from 'express';
import { db } from '../../db/database.js';
import { authenticate, AuthenticatedRequest, requireAccountsStaff } from '../auth.js';
import { TicketService } from '../../services/ticket-service.js';
import { UserRole, TicketStatus } from '../../types/index.js';

const router = Router();

/**
 * POST /api/tickets
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, serviceId, description, category, priority } = req.body;

    let targetStudentId = studentId;
    if (req.user!.role === UserRole.STUDENT) {
      targetStudentId = req.user!.studentId;
    }

    if (!targetStudentId) {
      return res.status(400).json({ error: 'Valid student ID is required' });
    }

    const ticket = await TicketService.createTicket(
      {
        studentId: targetStudentId,
        serviceId,
        description,
        category,
        priority,
      },
      req.user!.id
    );

    res.status(201).json(ticket);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create ticket' });
  }
});

/**
 * GET /api/tickets
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, serviceId, studentId } = req.query;
    const tickets = await TicketService.listTickets(
      req.user!.id,
      req.user!.role,
      {
        status: status as string,
        serviceId: serviceId as string,
        studentId: studentId as string,
      }
    );
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
});

/**
 * GET /api/tickets/:id
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const ticket = await TicketService.getTicketById(req.params.id, req.user!.id, req.user!.role);
    res.json(ticket);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Failed to retrieve ticket' });
  }
});

/**
 * PATCH /api/tickets/:id/status
 */
router.patch('/:id/status', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, notes } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'New status is required' });
    }

    const updated = await TicketService.updateTicketStatus(
      req.params.id,
      status as TicketStatus,
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      notes
    );

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Status transition failed' });
  }
});

/**
 * POST /api/tickets/:id/messages
 */
router.post('/:id/messages', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { message, isInternalOnly, attachmentUrl } = req.body;

    // Only accounts staff can send internal notes
    const internal = Boolean(isInternalOnly && req.user!.role !== UserRole.STUDENT);

    const createdMsg = await TicketService.addMessage(
      req.params.id,
      message,
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      internal,
      attachmentUrl
    );

    res.status(201).json(createdMsg);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to add message' });
  }
});

/**
 * POST /api/tickets/:id/escalate
 */
router.post('/:id/escalate', authenticate, requireAccountsStaff, async (req: AuthenticatedRequest, res) => {
  try {
    const { reason } = req.body;
    const escalated = await TicketService.escalateTicket(
      req.params.id,
      reason,
      req.user!.id,
      req.user!.fullName,
      req.user!.role
    );
    res.json(escalated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Ticket escalation failed' });
  }
});

/**
 * POST /api/tickets/:id/feedback
 */
router.post('/:id/feedback', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { rating, comments } = req.body;
    const ticketId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    await db.run(
      `UPDATE tickets 
       SET student_feedback_rating = ?, student_feedback_comments = ? 
       WHERE id = ?`,
      [rating, comments || null, ticketId]
    );

    res.json({ success: true, rating, comments });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to record feedback' });
  }
});

export default router;
