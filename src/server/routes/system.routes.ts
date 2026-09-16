import { Router } from 'express';
import { db } from '../../db/database.js';
import { authenticate, AuthenticatedRequest, requireSupervisor, requireAccountsStaff } from '../auth.js';
import { NotificationService } from '../../services/notification-service.js';

const router = Router();

/**
 * GET /api/semesters
 */
router.get('/semesters', async (_req, res) => {
  try {
    const semesters = await db.query<any>(`SELECT * FROM semesters ORDER BY start_date DESC`);
    res.json(semesters);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve semesters' });
  }
});

/**
 * GET /api/notifications
 */
router.get('/notifications', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const notifs = await NotificationService.getUserNotifications(req.user!.id);
    const unreadCount = await NotificationService.getUnreadCount(req.user!.id);
    res.json({ notifications: notifs, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch('/notifications/:id/read', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await NotificationService.markAsRead(req.params.id, req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * POST /api/notifications/mark-all-read
 */
router.post('/notifications/mark-all-read', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to mark all as read' });
  }
});

/**
 * GET /api/audit/logs
 * Accounts Supervisor audit trail inspection
 */
router.get('/audit/logs', authenticate, requireAccountsStaff, async (req: AuthenticatedRequest, res) => {
  try {
    const { entityType, action, limit } = req.query;
    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const params: any[] = [];

    if (entityType) {
      sql += ` AND entity_type = ?`;
      params.push(entityType);
    }

    if (action) {
      sql += ` AND action = ?`;
      params.push(action);
    }

    sql += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(Number(limit || 100));

    const logs = await db.query<any>(sql, params);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

export default router;
