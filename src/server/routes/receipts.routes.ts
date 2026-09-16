import { Router } from 'express';
import { db } from '../../db/database.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';
import { ReceiptService } from '../../services/receipt-service.js';
import { UserRole } from '../../types/index.js';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user!.role === UserRole.STUDENT) {
      const receipts = await ReceiptService.getStudentReceipts(
        req.user!.studentId!,
        req.user!.id,
        req.user!.role
      );
      return res.json(receipts);
    }

    // Accounts staff see all receipts
    const receipts = await db.query<any>(
      `SELECT r.*, s.student_number, u.full_name as student_name, sem.name as semester_name, p.payment_method
       FROM receipts r
       JOIN students s ON r.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN semesters sem ON r.semester_id = sem.id
       JOIN payments p ON r.payment_id = p.id
       ORDER BY r.created_at DESC`
    );
    res.json(receipts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve receipts' });
  }
});

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const receipt = await ReceiptService.getReceiptById(req.params.id, req.user!.id, req.user!.role);
    res.json(receipt);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Failed to retrieve receipt' });
  }
});

export default router;
