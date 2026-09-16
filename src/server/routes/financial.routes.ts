import { Router } from 'express';
import { db } from '../../db/database.js';
import { authenticate, AuthenticatedRequest, requireAccountsStaff, requireSeniorStaff } from '../auth.js';
import { EligibilityEngine } from '../../services/eligibility-engine.js';
import { LateChargeEngine } from '../../services/late-charge-engine.js';
import { UserRole } from '../../types/index.js';
import { UCU_PROGRAMME_FEE_STRUCTURES, findProgrammeFeeStructure } from '../../data/programme-fee-structures.js';

const router = Router();

/**
 * GET /api/financial/programme-structures
 * List all official UCU academic programme fee schedules and statutory policy thresholds
 */
router.get('/programme-structures', authenticate, async (_req, res) => {
  try {
    res.json(UCU_PROGRAMME_FEE_STRUCTURES);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve programme fee structures' });
  }
});

/**
 * GET /api/financial/programme-structures/:query
 * Retrieve fee structure by programme code or name
 */
router.get('/programme-structures/:query', authenticate, async (req, res) => {
  try {
    const structure = findProgrammeFeeStructure(req.params.query);
    res.json(structure);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve programme fee structure' });
  }
});

/**
 * GET /api/financial/policies
 */
router.get('/policies', authenticate, async (_req, res) => {
  try {
    const policies = await db.query<any>(
      `SELECT spp.*, sem.name as semester_name, sem.code as semester_code 
       FROM semester_payment_policies spp
       JOIN semesters sem ON spp.semester_id = sem.id
       ORDER BY spp.created_at DESC`
    );

    const milestones = await db.query<any>(
      `SELECT * FROM payment_milestones ORDER BY order_index ASC`
    );

    res.json({
      policies,
      milestones,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve payment policies' });
  }
});

/**
 * GET /api/registration-eligibility/check
 * Registration Financial Eligibility Engine
 */
router.get('/registration-eligibility/check', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    let studentId = req.query.studentId as string;
    const semesterId = req.query.semesterId as string;

    if (req.user!.role === UserRole.STUDENT) {
      studentId = req.user!.studentId!;
    }

    if (!studentId) {
      return res.status(400).json({ error: 'studentId query parameter is required' });
    }

    const result = await EligibilityEngine.evaluateStudent(studentId, semesterId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Eligibility evaluation failed' });
  }
});

/**
 * POST /api/financial/late-charges/evaluate
 * Trigger statutory automated late charges evaluation (Accounts Staff only)
 */
router.post('/late-charges/evaluate', authenticate, requireAccountsStaff, async (req: AuthenticatedRequest, res) => {
  try {
    const summary = await LateChargeEngine.evaluateLateChargesForActiveSemesters(req.user!.id);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Late charge evaluation failed' });
  }
});

/**
 * GET /api/financial/late-charges
 */
router.get('/late-charges', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    let sql = `
      SELECT l.*, s.student_number, u.full_name as student_name, pm.name as milestone_name, sem.name as semester_name
      FROM late_payment_charges l
      JOIN students s ON l.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN semesters sem ON l.semester_id = sem.id
      LEFT JOIN payment_milestones pm ON l.milestone_id = pm.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (req.user!.role === UserRole.STUDENT) {
      sql += ` AND l.student_id = ?`;
      params.push(req.user!.studentId);
    } else if (req.query.studentId) {
      sql += ` AND l.student_id = ?`;
      params.push(req.query.studentId);
    }

    sql += ` ORDER BY l.assessment_date DESC`;
    const charges = await db.query<any>(sql, params);
    res.json(charges);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve late charges' });
  }
});

/**
 * POST /api/financial/late-charges/:id/waive
 * Waive late payment charge (Senior Accounts Staff only)
 */
router.post('/late-charges/:id/waive', authenticate, requireSeniorStaff, async (req: AuthenticatedRequest, res) => {
  try {
    const chargeId = req.params.id;
    const { waiverReason } = req.body;

    if (!waiverReason || !waiverReason.trim()) {
      return res.status(400).json({ error: 'A valid waiver reason is required' });
    }

    const waived = await LateChargeEngine.waiveCharge(
      chargeId,
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      waiverReason
    );

    res.json(waived);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Charge waiver failed' });
  }
});

export default router;
