import { Router } from 'express';
import { db } from '../../db/database.js';
import { authenticate, AuthenticatedRequest, requireAccountsStaff, requireSeniorStaff } from '../auth.js';
import { UserRole } from '../../types/index.js';
import { FinancialEngine } from '../../services/financial-engine.js';
import { EligibilityEngine } from '../../services/eligibility-engine.js';

const router = Router();

/**
 * GET /api/students
 * List students with financial summaries (Accounts staff only)
 */
router.get('/', authenticate, requireAccountsStaff, async (req, res) => {
  try {
    const students = await db.query<any>(
      `SELECT s.*, u.full_name, u.email, u.phone,
              sfa.assessed_tuition, sfa.total_assessed, sfa.verified_amount_paid, 
              sfa.pending_amount_paid, sfa.outstanding_balance, sfa.payment_percentage,
              sfa.has_late_charges_assessed, sfa.total_late_charges
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN student_financial_accounts sfa ON s.id = sfa.student_id AND sfa.semester_id = 'SEM_EASTER_2026'
       ORDER BY s.student_number ASC`
    );
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve students' });
  }
});

/**
 * GET /api/students/:id
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const studentId = req.params.id;

    // Student isolation check
    if (req.user!.role === UserRole.STUDENT) {
      if (req.user!.studentId !== studentId) {
        return res.status(403).json({ error: 'Access Denied: You cannot view another student’s profile' });
      }
    }

    const student = await db.getOne<any>(
      `SELECT s.*, u.full_name, u.email, u.phone, u.avatar_url
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [studentId]
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve student' });
  }
});

/**
 * GET /api/students/:id/financial-account
 */
router.get('/:id/financial-account', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const studentId = req.params.id;
    const semesterId = (req.query.semesterId as string) || 'SEM_EASTER_2026';

    if (req.user!.role === UserRole.STUDENT && req.user!.studentId !== studentId) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    const calculation = await FinancialEngine.recalculateStudentAccount(studentId, semesterId);
    const eligibility = await EligibilityEngine.evaluateStudent(studentId, semesterId);

    res.json({
      calculation,
      eligibility,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve financial account' });
  }
});

/**
 * GET /api/students/:id/statement
 * Detailed financial ledger statement
 */
router.get('/:id/statement', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const studentId = req.params.id;
    const semesterId = (req.query.semesterId as string) || 'SEM_EASTER_2026';

    if (req.user!.role === UserRole.STUDENT && req.user!.studentId !== studentId) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    const student = await db.getOne<any>(
      `SELECT s.*, u.full_name, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?`,
      [studentId]
    );

    const account = await db.getOne<any>(
      `SELECT * FROM student_financial_accounts WHERE student_id = ? AND semester_id = ?`,
      [studentId, semesterId]
    );

    const semester = await db.getOne<any>(`SELECT * FROM semesters WHERE id = ?`, [semesterId]);

    const payments = await db.query<any>(
      `SELECT * FROM payments WHERE student_id = ? AND semester_id = ? ORDER BY payment_date ASC`,
      [studentId, semesterId]
    );

    const lateCharges = await db.query<any>(
      `SELECT * FROM late_payment_charges WHERE student_id = ? AND semester_id = ? ORDER BY assessment_date ASC`,
      [studentId, semesterId]
    );

    res.json({
      student,
      semester,
      account,
      payments,
      lateCharges,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve financial statement' });
  }
});

/**
 * POST /api/students/:id/holds
 * Manage student administrative financial hold (Senior Accounts Staff only)
 */
router.post('/:id/holds', authenticate, requireSeniorStaff, async (req: AuthenticatedRequest, res) => {
  try {
    const studentId = req.params.id;
    const { hasHold, reason } = req.body;

    await db.run(
      `UPDATE students 
       SET has_financial_hold = ?, financial_hold_reason = ? 
       WHERE id = ?`,
      [hasHold ? 1 : 0, hasHold ? reason : null, studentId]
    );

    // Audit Log
    await db.run(
      `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        `AUD_${Date.now()}`,
        req.user!.id,
        req.user!.role,
        req.user!.fullName,
        hasHold ? 'FINANCIAL_HOLD_APPLIED' : 'FINANCIAL_HOLD_CLEARED',
        'STUDENT_HOLD',
        studentId,
        null,
        hasHold ? 'HELD' : 'CLEARED',
        reason || 'No specific reason provided',
      ]
    );

    res.json({ success: true, hasFinancialHold: hasHold, reason });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update student hold' });
  }
});

export default router;
