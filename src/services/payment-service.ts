/**
 * CampusQ — UCU Accounts Office Payment Management & Verification Service
 * Handles secure submission, unique transaction check, verification workflows,
 * milestone re-evaluations, receipt generation, and audit trails.
 */

import { db } from '../db/database.js';
import { FinancialEngine } from './financial-engine.js';
import { ReceiptService } from './receipt-service.js';
import { PaymentStatus, PaymentMethod, NotificationType, UserRole } from '../types/index.js';

export interface SubmitPaymentInput {
  studentId: string;
  semesterId: string;
  transactionReference: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  proofDocumentUrl?: string;
}

export class PaymentService {
  /**
   * Submit a payment for verification by the Accounts Office
   */
  static async submitPayment(input: SubmitPaymentInput, userId: string) {
    // 1. Amount validation: must be strictly positive
    if (!input.amount || input.amount <= 0) {
      throw new Error('Payment amount must be a positive number greater than zero (UGX).');
    }

    const cleanRef = input.transactionReference.trim();
    if (!cleanRef) {
      throw new Error('Transaction reference cannot be empty.');
    }

    // 2. Duplicate reference check: Transaction references must be globally unique
    const existing = await db.getOne<any>(
      `SELECT id, status, amount, submitted_at FROM payments WHERE UPPER(transaction_reference) = UPPER(?)`,
      [cleanRef]
    );

    if (existing) {
      throw new Error(
        `Duplicate transaction reference '${cleanRef}'. This reference has already been submitted into the system (Status: ${existing.status}). Duplicate submissions are strictly prohibited.`
      );
    }

    const paymentId = `PAY_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    await db.transaction(async (tx) => {
      // 3. Insert payment in PENDING_VERIFICATION status
      await tx.run(
        `INSERT INTO payments (
          id, student_id, semester_id, transaction_reference, amount, payment_date, 
          payment_method, status, notes, proof_document_url, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          paymentId,
          input.studentId,
          input.semesterId,
          cleanRef,
          input.amount,
          input.paymentDate || new Date().toISOString().split('T')[0],
          input.paymentMethod,
          PaymentStatus.PENDING_VERIFICATION,
          input.notes || null,
          input.proofDocumentUrl || null,
        ]
      );

      // 4. Update student pending tally (without counting towards verified percentage!)
      await tx.run(
        `UPDATE student_financial_accounts 
         SET pending_amount_paid = pending_amount_paid + ?, updated_at = CURRENT_TIMESTAMP 
         WHERE student_id = ? AND semester_id = ?`,
        [input.amount, input.studentId, input.semesterId]
      );

      // 5. Send notification to student
      const notifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await tx.run(
        `INSERT INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
        [
          notifId,
          userId,
          NotificationType.PAYMENT_SUBMITTED,
          'Payment Submitted for Verification',
          `Your payment of UGX ${input.amount.toLocaleString()} (Ref: ${cleanRef}) has been received and queued for Accounts verification.`,
          paymentId,
        ]
      );

      // 6. Audit Log
      const auditId = `AUD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await tx.run(
        `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          auditId,
          userId,
          UserRole.STUDENT,
          'Student',
          'PAYMENT_SUBMITTED',
          'PAYMENT',
          paymentId,
          null,
          `UGX ${input.amount}`,
          `Submitted payment reference ${cleanRef} via ${input.paymentMethod}`,
        ]
      );
    });

    return await db.getOne<any>(`SELECT * FROM payments WHERE id = ?`, [paymentId]);
  }

  /**
   * Verify an unverified payment (Accounts Officer or Senior Officer)
   */
  static async verifyPayment(
    paymentId: string,
    staffId: string,
    staffName: string,
    staffRole: UserRole,
    staffUserId: string,
    verificationNotes?: string
  ) {
    const payment = await db.getOne<any>(`SELECT * FROM payments WHERE id = ?`, [paymentId]);
    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    if (payment.status === PaymentStatus.VERIFIED) {
      throw new Error(`Payment ${payment.transaction_reference} is already VERIFIED.`);
    }

    let generatedReceipt: any = null;

    await db.transaction(async (tx) => {
      const now = new Date().toISOString();

      // 1. Update payment status to VERIFIED
      await tx.run(
        `UPDATE payments 
         SET status = ?, verified_by = ?, verified_at = ?, notes = COALESCE(?, notes) 
         WHERE id = ?`,
        [PaymentStatus.VERIFIED, staffId, now, verificationNotes || null, paymentId]
      );

      // 2. Insert into payment_verifications audit table
      const pvId = `PV_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await tx.run(
        `INSERT INTO payment_verifications (id, payment_id, staff_id, action, reason, previous_status, new_status, verified_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [pvId, paymentId, staffId, 'VERIFIED', verificationNotes || 'Verification approved', payment.status, PaymentStatus.VERIFIED]
      );

      // 3. Recalculate financial account (adds to verified, deducts from pending, updates balance and %)
      await FinancialEngine.recalculateStudentAccount(payment.student_id, payment.semester_id);

      // 4. Generate official receipt automatically
      generatedReceipt = await ReceiptService.generateReceiptForPayment(paymentId, staffName, tx);

      // 5. Query student details for notifications
      const student = await tx.getOne<any>(
        `SELECT s.*, u.id as user_id, u.full_name, sfa.payment_percentage 
         FROM students s
         JOIN users u ON s.user_id = u.id
         JOIN student_financial_accounts sfa ON sfa.student_id = s.id AND sfa.semester_id = ?
         WHERE s.id = ?`,
        [payment.semester_id, payment.student_id]
      );

      // 6. Notify student of verified payment & receipt
      const notif1 = `NOTIF_${Date.now()}_1`;
      await tx.run(
        `INSERT INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
        [
          notif1,
          student.user_id,
          NotificationType.PAYMENT_VERIFIED,
          'Payment Verified Successfully',
          `Your payment of UGX ${Number(payment.amount).toLocaleString()} (Ref: ${payment.transaction_reference}) has been verified by ${staffName}. Official receipt ${generatedReceipt.receipt_number} is available.`,
          paymentId,
        ]
      );

      // Check if student has just crossed the 45% threshold
      if (Number(student.payment_percentage) >= 45.0) {
        const notif2 = `NOTIF_${Date.now()}_2`;
        await tx.run(
          `INSERT INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
          [
            notif2,
            student.user_id,
            NotificationType.REGISTRATION_ELIGIBILITY_ACHIEVED,
            'Registration Eligibility Achieved!',
            `Congratulations! Your verified payments have reached ${student.payment_percentage}%, achieving the financial threshold for semester course registration.`,
            payment.semester_id,
          ]
        );
      }

      // 7. Audit Log
      const auditId = `AUD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await tx.run(
        `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          auditId,
          staffUserId,
          staffRole,
          staffName,
          'PAYMENT_VERIFIED',
          'PAYMENT',
          paymentId,
          payment.status,
          PaymentStatus.VERIFIED,
          `Verified payment reference ${payment.transaction_reference} for UGX ${payment.amount}. Receipt ${generatedReceipt.receipt_number} issued.`,
        ]
      );
    });

    return {
      payment: await db.getOne<any>(`SELECT * FROM payments WHERE id = ?`, [paymentId]),
      receipt: generatedReceipt,
    };
  }

  /**
   * Reject a payment submission with formal audit reason
   */
  static async rejectPayment(
    paymentId: string,
    staffId: string,
    staffName: string,
    staffRole: UserRole,
    staffUserId: string,
    rejectionReason: string
  ) {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('A detailed formal rejection reason is required to reject a payment submission.');
    }

    const payment = await db.getOne<any>(`SELECT * FROM payments WHERE id = ?`, [paymentId]);
    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    await db.transaction(async (tx) => {
      // 1. Update payment status to REJECTED
      await tx.run(
        `UPDATE payments 
         SET status = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP, rejection_reason = ? 
         WHERE id = ?`,
        [PaymentStatus.REJECTED, staffId, rejectionReason, paymentId]
      );

      // 2. Record in payment verifications table
      const pvId = `PV_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await tx.run(
        `INSERT INTO payment_verifications (id, payment_id, staff_id, action, reason, previous_status, new_status, verified_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [pvId, paymentId, staffId, 'REJECTED', rejectionReason, payment.status, PaymentStatus.REJECTED]
      );

      // 3. Recalculate account
      await FinancialEngine.recalculateStudentAccount(payment.student_id, payment.semester_id);

      // 4. Notify student
      const student = await tx.getOne<any>(`SELECT user_id FROM students WHERE id = ?`, [payment.student_id]);
      if (student) {
        const notifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await tx.run(
          `INSERT INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
          [
            notifId,
            student.user_id,
            NotificationType.PAYMENT_REJECTED,
            'Payment Verification Rejected',
            `Your payment submission of UGX ${Number(payment.amount).toLocaleString()} (Ref: ${payment.transaction_reference}) was rejected by Accounts staff. Reason: "${rejectionReason}".`,
            paymentId,
          ]
        );
      }

      // 5. Audit Log
      const auditId = `AUD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await tx.run(
        `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          auditId,
          staffUserId,
          staffRole,
          staffName,
          'PAYMENT_REJECTED',
          'PAYMENT',
          paymentId,
          payment.status,
          PaymentStatus.REJECTED,
          `Rejected payment reference ${payment.transaction_reference} for UGX ${payment.amount}. Reason: ${rejectionReason}`,
        ]
      );
    });

    return await db.getOne<any>(`SELECT * FROM payments WHERE id = ?`, [paymentId]);
  }
}
