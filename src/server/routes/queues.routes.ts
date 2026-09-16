import { Router } from 'express';
import { db } from '../../db/database.js';
import { authenticate, AuthenticatedRequest, requireAccountsStaff } from '../auth.js';
import { QueueService } from '../../services/queue-service.js';
import { UserRole } from '../../types/index.js';

const router = Router();

/**
 * GET /api/queues
 * Retrieve queue entries with student and service details
 */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT 
        qe.*, 
        srv.name as service_name, 
        srv.category_id,
        s.student_number, 
        u.full_name as student_name
      FROM queue_entries qe
      JOIN services srv ON qe.service_id = srv.id
      JOIN students s ON qe.student_id = s.id
      JOIN users u ON s.user_id = u.id
    `;
    const params: any[] = [];
    if (status) {
      sql += ` WHERE qe.status = ?`;
      params.push(status);
    } else {
      sql += ` WHERE qe.status IN ('WAITING', 'CALLED', 'SERVING')`;
    }
    sql += `
      ORDER BY 
        CASE 
          WHEN qe.status = 'SERVING' THEN 1
          WHEN qe.status = 'CALLED' THEN 2
          ELSE 3
        END,
        qe.position ASC,
        qe.created_at ASC
    `;
    const entries = await db.query<any>(sql, params);
    res.json(entries || []);
  } catch (err: any) {
    console.error('Error fetching queue entries:', err);
    res.status(500).json({ error: 'Failed to retrieve queue entries' });
  }
});

/**
 * GET /api/queues/live
 * Public / Display screen view of current serving numbers and counters
 */
router.get('/live', async (_req, res) => {
  try {
    const liveState = await QueueService.getLiveQueueState();
    res.json(liveState);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve live queue' });
  }
});

/**
 * GET /api/queues/counters
 */
router.get('/counters', async (_req, res) => {
  try {
    const counters = await db.query<any>(
      `SELECT c.*, ast.title as staff_title, u.full_name as staff_name 
       FROM counters c
       LEFT JOIN accounts_staff ast ON c.staff_id = ast.id
       LEFT JOIN users u ON ast.user_id = u.id`
    );
    res.json(counters);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve counters' });
  }
});

/**
 * GET /api/queues/my-active
 * Get the calling student's active queue entry if any
 */
router.get('/my-active', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user!.role !== UserRole.STUDENT) {
      return res.json({ activeEntry: null });
    }

    const studentId = req.user!.studentId;
    const entry = await db.getOne<any>(
      `SELECT qe.*, srv.name as service_name, srv.category_id 
       FROM queue_entries qe
       JOIN services srv ON qe.service_id = srv.id
       WHERE qe.student_id = ? AND qe.status IN ('WAITING', 'CALLED', 'SERVING')
       ORDER BY qe.created_at DESC LIMIT 1`,
      [studentId]
    );

    res.json({ activeEntry: entry || null });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve active queue entry' });
  }
});

/**
 * POST /api/queues/join
 */
router.post('/join', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { serviceId, priority, ticketId } = req.body;
    let studentId = req.user!.studentId;

    if (!studentId) {
      return res.status(400).json({ error: 'Only registered students can join the virtual queue' });
    }

    const entry = await QueueService.joinQueue(studentId, serviceId, priority, ticketId);
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to join queue' });
  }
});

/**
 * POST /api/queues/call-next
 * Accounts staff calls the next student in queue
 */
router.post('/call-next', authenticate, requireAccountsStaff, async (req: AuthenticatedRequest, res) => {
  try {
    const { counterName } = req.body;
    const staffId = req.user!.staffId || 'STF_ACC_1';
    const counter = counterName || 'Counter 1 — Payment Verification';

    const calledEntry = await QueueService.callNextStudent(
      staffId,
      counter,
      req.user!.id,
      req.user!.fullName
    );

    if (!calledEntry) {
      return res.json({ message: 'No students currently waiting in the virtual queue.' });
    }

    res.json(calledEntry);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to call next student' });
  }
});

/**
 * POST /api/queues/:id/serve
 */
router.post('/:id/serve', authenticate, requireAccountsStaff, async (req, res) => {
  try {
    const entry = await QueueService.startServing(req.params.id);
    res.json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to start serving' });
  }
});

/**
 * POST /api/queues/:id/complete
 */
router.post('/:id/complete', authenticate, requireAccountsStaff, async (req, res) => {
  try {
    const { counterName } = req.body;
    const entry = await QueueService.completeService(req.params.id, counterName);
    res.json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to complete service' });
  }
});

/**
 * POST /api/queues/:id/skip
 */
router.post('/:id/skip', authenticate, requireAccountsStaff, async (req, res) => {
  try {
    const entry = await QueueService.skipStudent(req.params.id);
    res.json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to skip queue entry' });
  }
});

/**
 * POST /api/queues/:id/cancel
 */
router.post('/:id/cancel', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await QueueService.cancelQueueEntry(req.params.id, req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to cancel queue entry' });
  }
});

export default router;
