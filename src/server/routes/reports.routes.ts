import { Router } from 'express';
import { authenticate, requireAccountsStaff } from '../auth.js';
import { ReportsService } from '../../services/reports-service.js';

const router = Router();

router.get('/summary', authenticate, requireAccountsStaff, async (req, res) => {
  try {
    const semesterId = req.query.semesterId as string;
    const summary = await ReportsService.getAccountsSummary(semesterId);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate accounts summary report' });
  }
});

export default router;
