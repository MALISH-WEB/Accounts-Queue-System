/**
 * CampusQ — UCU Accounts Office Late-Payment Charge Engine
 * Automated statutory late fee assessment, duplicate charge prevention, and waiver management.
 */

import { db } from '../db/database.js';
import { FinancialEngine } from './financial-engine.js';
import { LatePaymentChargeMode, LatePaymentChargeStatus, NotificationType, UserRole } from '../types/index.js';

export interface LateChargeAssessmentSummary {
  evaluatedStudentsCount: number;
  newChargesAssessedCount: number;
  skippedAlreadyAchievedCount: number;
  skippedDuplicateCount: number;
  errors: string[];
}

export class LateChargeEngine {
  /**
   * Run the automated statutory late charge evaluation across all active student accounts
   */
  static async evaluateLateChargesForActiveSemesters(systemUserId = 'SYS_JOB'): Promise<LateChargeAssessmentSummary> {
    const summary: LateChargeAssessmentSummary = {
      evaluatedStudentsCount: 0,
      newChargesAssessedCount: 0,
      skippedAlreadyAchievedCount: 0,
      skippedDuplicateCount: 0,
      errors: [],
    };

    // 1. Retrieve current semester
    const semester = await db.getOne<any>(`SELECT * FROM semesters WHERE is_current = 1 LIMIT 1`);
    if (!semester) {
      summary.errors.push('No active semester configured');
      return summary;
    }

    // 2. Retrieve payment policy
    const policy = await db.getOne<any>(
      `SELECT * FROM semester_payment_policies WHERE semester_id = ? AND is_active = 1`,
      [semester.id]
    );

    if (!policy) {
      summary.errors.push(`No active policy configured for semester ${semester.id}`);
      return summary;
    }

    const defaultChargeAmount = Number(policy.late_payment_charge_amount || 50000);
    const chargeMode = policy.charge_mode || LatePaymentChargeMode.ONCE_PER_MILESTONE;

    // 3. Retrieve milestones
    const milestones = await db.query<any>(
      `SELECT * FROM payment_milestones WHERE policy_id = ? AND is_active = 1 ORDER BY order_index ASC`,
      [policy.id]
    );

    const today = new Date().toISOString().split('T')[0];

    // Check which milestones have passed their statutory deadline
    const expiredMilestones = milestones.filter((m) => m.deadline < today);

    // 4. Retrieve all student financial accounts for this semester
    const accounts = await db.query<any>(
      `SELECT sfa.*, s.user_id, s.student_number 
       FROM student_financial_accounts sfa
       JOIN students s ON sfa.student_id = s.id
       WHERE sfa.semester_id = ?`,
      [semester.id]
    );

    for (const acc of accounts) {
      summary.evaluatedStudentsCount++;
      const studentId = acc.student_id;
      const totalAssessed = Number(acc.total_assessed || acc.assessed_tuition);

      // Fetch sum of verified payments
      const verifiedRow = await db.getOne<any>(
        `SELECT COALESCE(SUM(amount), 0) as total_verified 
         FROM payments 
         WHERE student_id = ? AND semester_id = ? AND status = 'VERIFIED'`,
        [studentId, semester.id]
      );
      const verifiedAmount = Number(verifiedRow?.total_verified || 0);
      const currentPercent = FinancialEngine.calculatePercentage(verifiedAmount, totalAssessed);

      for (const milestone of expiredMilestones) {
        const requiredPercent = Number(milestone.required_percentage);

        // Rule 1: A charge must NOT be created if the student has already achieved the required milestone
        if (currentPercent >= requiredPercent) {
          summary.skippedAlreadyAchievedCount++;
          continue;
        }

        // Rule 2: A charge must NOT be duplicated for the same student, semester, milestone, and charge mode
        const existingCharge = await db.getOne<any>(
          `SELECT id FROM late_payment_charges 
           WHERE student_id = ? AND semester_id = ? AND milestone_id = ? AND charge_mode = ?`,
          [studentId, semester.id, milestone.id, chargeMode]
        );

        if (existingCharge) {
          summary.skippedDuplicateCount++;
          continue;
        }

        // Assess new late-payment charge
        const chargeId = `LATE_CHG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const reason = `Statutory late payment charge assessed for failing to attain the ${milestone.name} threshold by the ${milestone.deadline} deadline. (Paid: ${currentPercent}% / Required: ${requiredPercent}%).`;

        await db.run(
          `INSERT INTO late_payment_charges (
            id, student_id, semester_id, milestone_id, amount, reason, charge_mode, assessment_date, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            chargeId,
            studentId,
            semester.id,
            milestone.id,
            defaultChargeAmount,
            reason,
            chargeMode,
            today,
            LatePaymentChargeStatus.ASSESSED,
          ]
        );

        // Update financial account to flag late charges
        await db.run(
          `UPDATE student_financial_accounts 
           SET has_late_charges_assessed = 1, 
               total_late_charges = total_late_charges + ? 
           WHERE student_id = ? AND semester_id = ?`,
          [defaultChargeAmount, studentId, semester.id]
        );

        // Send Notification to student
        const notifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await db.run(
          `INSERT INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
          [
            notifId,
            acc.user_id,
            NotificationType.LATE_PAYMENT_CHARGE_ASSESSED,
            `Late Payment Charge Assessed: UGX ${defaultChargeAmount.toLocaleString()}`,
            reason,
            chargeId,
          ]
        );

        // Audit Log
        const auditId = `AUD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await db.run(
          `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            auditId,
            systemUserId,
            UserRole.ACCOUNTS_SUPERVISOR,
            'Automated Late Charge Engine',
            'LATE_PAYMENT_CHARGE_ASSESSED',
            'LATE_PAYMENT_CHARGE',
            chargeId,
            null,
            `UGX ${defaultChargeAmount}`,
            `Assessed to student ${acc.student_number} for milestone ${milestone.name}`,
          ]
        );

        summary.newChargesAssessedCount++;
      }
    }

    return summary;
  }

  /**
   * Waive an assessed late payment charge (Senior Officer or Supervisor only)
   */
  static async waiveCharge(
    chargeId: string,
    waivedByUserId: string,
    waivedByUserName: string,
    waivedByUserRole: UserRole,
    waiverReason: string
  ): Promise<any> {
    const charge = await db.getOne<any>(`SELECT * FROM late_payment_charges WHERE id = ?`, [chargeId]);
    if (!charge) {
      throw new Error(`Late-payment charge ${chargeId} not found`);
    }

    if (charge.status === LatePaymentChargeStatus.WAIVED) {
      throw new Error('This charge has already been waived');
    }

    const today = new Date().toISOString();

    await db.run(
      `UPDATE late_payment_charges 
       SET status = ?, waived_by = ?, waived_at = ?, waiver_reason = ? 
       WHERE id = ?`,
      [LatePaymentChargeStatus.WAIVED, waivedByUserId, today, waiverReason, chargeId]
    );

    // Reduce charge from student account
    await db.run(
      `UPDATE student_financial_accounts 
       SET total_late_charges = MAX(0, total_late_charges - ?) 
       WHERE student_id = ? AND semester_id = ?`,
      [Number(charge.amount), charge.student_id, charge.semester_id]
    );

    // Audit log
    const auditId = `AUD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await db.run(
      `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        auditId,
        waivedByUserId,
        waivedByUserRole,
        waivedByUserName,
        'LATE_PAYMENT_CHARGE_WAIVED',
        'LATE_PAYMENT_CHARGE',
        chargeId,
        'ASSESSED',
        'WAIVED',
        `Waiver approved. Reason: ${waiverReason}`,
      ]
    );

    // Notify student
    const student = await db.getOne<any>(`SELECT user_id FROM students WHERE id = ?`, [charge.student_id]);
    if (student) {
      const notifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await db.run(
        `INSERT INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)`,
        [
          notifId,
          student.user_id,
          NotificationType.LATE_PAYMENT_CHARGE_WAIVED,
          'Late Payment Charge Waived',
          `Your late payment charge of UGX ${Number(charge.amount).toLocaleString()} was waived by Accounts administration. Reason: ${waiverReason}`,
          chargeId,
        ]
      );
    }

    return await db.getOne<any>(`SELECT * FROM late_payment_charges WHERE id = ?`, [chargeId]);
  }
}
