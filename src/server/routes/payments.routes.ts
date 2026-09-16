import { Router } from 'express';
import { db } from '../../db/database.js';
import { authenticate, AuthenticatedRequest, requireAccountsStaff } from '../auth.js';
import { PaymentService } from '../../services/payment-service.js';
import { UserRole } from '../../types/index.js';

const router = Router();

/**
 * POST /api/payments
 * Student submits proof of bank / mobile money payment
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, semesterId, transactionReference, amount, paymentDate, paymentMethod, notes, proofDocumentUrl } = req.body;

    // Student isolation: Students can only submit for themselves
    let targetStudentId = studentId;
    if (req.user!.role === UserRole.STUDENT) {
      targetStudentId = req.user!.studentId;
    }

    if (!targetStudentId) {
      return res.status(400).json({ error: 'Valid student ID is required' });
    }

    const payment = await PaymentService.submitPayment(
      {
        studentId: targetStudentId,
        semesterId: semesterId || 'SEM_EASTER_2026',
        transactionReference,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        notes,
        proofDocumentUrl,
      },
      req.user!.id
    );

    res.status(201).json(payment);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Payment submission failed' });
  }
});

/**
 * GET /api/payments
 * Query payments with student isolation and filters
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, studentId, semesterId } = req.query;

    let sql = `
      SELECT p.*, s.student_number, s.programme, u.full_name as student_name, sem.name as semester_name,
             u_staff.full_name as verified_by_staff_name
      FROM payments p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN semesters sem ON p.semester_id = sem.id
      LEFT JOIN accounts_staff ast ON p.verified_by = ast.id
      LEFT JOIN users u_staff ON ast.user_id = u_staff.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Data isolation
    if (req.user!.role === UserRole.STUDENT) {
      sql += ` AND p.student_id = ?`;
      params.push(req.user!.studentId);
    } else if (studentId) {
      sql += ` AND p.student_id = ?`;
      params.push(studentId);
    }

    if (status) {
      sql += ` AND p.status = ?`;
      params.push(status);
    }

    if (semesterId) {
      sql += ` AND p.semester_id = ?`;
      params.push(semesterId);
    }

    sql += ` ORDER BY p.submitted_at DESC`;
    const payments = await db.query<any>(sql, params);
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

/**
 * GET /api/payments/:id
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const payment = await db.getOne<any>(
      `SELECT p.*, s.student_number, u.full_name as student_name, sem.name as semester_name
       FROM payments p
       JOIN students s ON p.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN semesters sem ON p.semester_id = sem.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (req.user!.role === UserRole.STUDENT && payment.student_id !== req.user!.studentId) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    res.json(payment);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve payment' });
  }
});

/**
 * POST /api/payment-verification/:id/verify
 * Accounts staff marks payment as verified
 */
router.post('/verification/:id/verify', authenticate, requireAccountsStaff, async (req: AuthenticatedRequest, res) => {
  try {
    const paymentId = req.params.id;
    const { notes } = req.body;

    const result = await PaymentService.verifyPayment(
      paymentId,
      req.user!.staffId || 'STF_ACC_1',
      req.user!.fullName,
      req.user!.role,
      req.user!.id,
      notes
    );

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Verification failed' });
  }
});

/**
 * POST /api/payment-verification/:id/reject
 * Accounts staff rejects payment with documented audit reason
 */
router.post('/verification/:id/reject', authenticate, requireAccountsStaff, async (req: AuthenticatedRequest, res) => {
  try {
    const paymentId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is mandatory' });
    }

    const rejected = await PaymentService.rejectPayment(
      paymentId,
      req.user!.staffId || 'STF_ACC_1',
      req.user!.fullName,
      req.user!.role,
      req.user!.id,
      reason
    );

    res.json(rejected);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Rejection failed' });
  }
});

export default router;
