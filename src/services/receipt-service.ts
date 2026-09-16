/**
 * CampusQ — UCU Accounts Office Official Receipt Service
 * Generates and verifies authentic downloadable PDF receipts with student isolation.
 */

import { db, DatabaseAdapter } from '../db/database.js';
import { UserRole } from '../types/index.js';

export class ReceiptService {
  /**
   * Automatically generate an official UCU electronic receipt for a verified payment
   */
  static async generateReceiptForPayment(
    paymentId: string,
    verifiedByStaffName: string,
    tx?: DatabaseAdapter
  ) {
    const runner = tx || db;

    const payment = await runner.getOne<any>(`SELECT * FROM payments WHERE id = ?`, [paymentId]);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    // Check if receipt already exists
    const existing = await runner.getOne<any>(`SELECT * FROM receipts WHERE payment_id = ?`, [paymentId]);
    if (existing) {
      return existing;
    }

    // Sequential receipt number format: UCU-REC-YYYY-XXXX
    const countRow = await runner.getOne<any>(`SELECT COUNT(*) as total FROM receipts`);
    const nextNum = (countRow?.total || 0) + 1;
    const year = new Date().getFullYear();
    const formattedSeq = String(nextNum).padStart(4, '0');
    const receiptNumber = `UCU-REC-${year}-${formattedSeq}`;

    const receiptId = `REC_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    await runner.run(
      `INSERT INTO receipts (
        id, receipt_number, payment_id, student_id, semester_id, amount, currency,
        transaction_reference, payment_date, verification_date, verified_by_staff_name, download_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        receiptId,
        receiptNumber,
        payment.id,
        payment.student_id,
        payment.semester_id,
        payment.amount,
        'UGX',
        payment.transaction_reference,
        payment.payment_date,
        now,
        verifiedByStaffName,
        now,
      ]
    );

    return await runner.getOne<any>(`SELECT * FROM receipts WHERE id = ?`, [receiptId]);
  }

  /**
   * Retrieve a receipt with strict student isolation
   */
  static async getReceiptById(receiptId: string, requestingUserId: string, requestingRole: UserRole) {
    const receipt = await db.getOne<any>(
      `SELECT r.*, s.student_number, s.registration_number, s.programme, s.faculty, u.full_name as student_name, sem.name as semester_name, p.payment_method
       FROM receipts r
       JOIN students s ON r.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN semesters sem ON r.semester_id = sem.id
       JOIN payments p ON r.payment_id = p.id
       WHERE r.id = ?`,
      [receiptId]
    );

    if (!receipt) {
      throw new Error(`Receipt ${receiptId} not found`);
    }

    // Enforce student data isolation: If student, must belong to them
    if (requestingRole === UserRole.STUDENT) {
      const student = await db.getOne<any>(`SELECT id FROM students WHERE user_id = ?`, [requestingUserId]);
      if (!student || student.id !== receipt.student_id) {
        throw new Error('Access Denied: You are not authorized to view another student’s financial receipt.');
      }
    }

    // Increment download/view count
    await db.run(`UPDATE receipts SET download_count = download_count + 1 WHERE id = ?`, [receiptId]);

    return receipt;
  }

  /**
   * Get all receipts for a student with data isolation check
   */
  static async getStudentReceipts(studentId: string, requestingUserId: string, requestingRole: UserRole) {
    if (requestingRole === UserRole.STUDENT) {
      const student = await db.getOne<any>(`SELECT id FROM students WHERE user_id = ?`, [requestingUserId]);
      if (!student || student.id !== studentId) {
        throw new Error('Access Denied: You cannot view receipts belonging to another student.');
      }
    }

    return await db.query<any>(
      `SELECT r.*, sem.name as semester_name, p.payment_method 
       FROM receipts r
       JOIN semesters sem ON r.semester_id = sem.id
       JOIN payments p ON r.payment_id = p.id
       WHERE r.student_id = ?
       ORDER BY r.created_at DESC`,
      [studentId]
    );
  }
}
