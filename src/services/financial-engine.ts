/**
 * CampusQ — UCU Accounts Office Financial Rules & Policy Engine
 * Strict verified-only payment calculation, milestone tracking, and balance ledger.
 */

import { db } from '../db/database.js';
import { FinancialEligibilityResult, EligibilityStatus } from '../types/index.js';

export interface MilestoneEvaluation {
  id: string;
  name: string;
  requiredPercentage: number;
  achieved: boolean;
  deadline: string;
  deficitAmount: number;
}

export interface FinancialCalculation {
  assessedTuition: number;
  otherAssessedFees: number;
  totalAssessed: number;
  verifiedAmountPaid: number;
  pendingAmountPaid: number;
  outstandingBalance: number;
  paymentPercentage: number;
  milestones: MilestoneEvaluation[];
}

export class FinancialEngine {
  /**
   * Round to 2 decimal places with mathematical precision
   */
  static round(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculate verified-only payment percentage
   * Formula: verified amount paid / assessed semester tuition * 100
   * (Pending, rejected, and unverified payments NEVER count)
   */
  static calculatePercentage(verifiedAmountPaid: number, totalAssessed: number): number {
    if (totalAssessed <= 0) return 0;
    if (verifiedAmountPaid <= 0) return 0;
    const raw = (verifiedAmountPaid / totalAssessed) * 100;
    // Cap at 100.00% max for standard percentages, but precision to 2 decimal places
    const rounded = Math.min(100, FinancialEngine.round(raw));
    return rounded;
  }

  /**
   * Calculate outstanding balance
   * Formula: totalAssessed - verifiedAmountPaid
   */
  static calculateOutstandingBalance(totalAssessed: number, verifiedAmountPaid: number): number {
    const bal = totalAssessed - verifiedAmountPaid;
    return Math.max(0, FinancialEngine.round(bal));
  }

  /**
   * Amount needed to achieve a target percentage
   */
  static calculateDeficitForPercentage(
    totalAssessed: number,
    verifiedAmountPaid: number,
    targetPercentage: number
  ): number {
    const requiredAmount = (targetPercentage / 100) * totalAssessed;
    const deficit = requiredAmount - verifiedAmountPaid;
    return Math.max(0, FinancialEngine.round(deficit));
  }

  /**
   * Recalculate and update the student financial account in the database based solely on verified payments
   */
  static async recalculateStudentAccount(studentId: string, semesterId: string): Promise<FinancialCalculation> {
    // 1. Get financial account
    const account = await db.getOne<any>(
      `SELECT * FROM student_financial_accounts WHERE student_id = ? AND semester_id = ?`,
      [studentId, semesterId]
    );

    if (!account) {
      throw new Error(`Financial account not found for student ${studentId} in semester ${semesterId}`);
    }

    const totalAssessed = Number(account.total_assessed || account.assessed_tuition);

    // 2. Query sum of verified payments
    const verifiedRow = await db.getOne<any>(
      `SELECT COALESCE(SUM(amount), 0) as total_verified 
       FROM payments 
       WHERE student_id = ? AND semester_id = ? AND status = 'VERIFIED'`,
      [studentId, semesterId]
    );
    const verifiedAmountPaid = Number(verifiedRow?.total_verified || 0);

    // 3. Query sum of pending payments (for information only - does NOT affect eligibility)
    const pendingRow = await db.getOne<any>(
      `SELECT COALESCE(SUM(amount), 0) as total_pending 
       FROM payments 
       WHERE student_id = ? AND semester_id = ? AND status = 'PENDING_VERIFICATION'`,
      [studentId, semesterId]
    );
    const pendingAmountPaid = Number(pendingRow?.total_pending || 0);

    // 4. Compute metrics
    const paymentPercentage = FinancialEngine.calculatePercentage(verifiedAmountPaid, totalAssessed);
    const outstandingBalance = FinancialEngine.calculateOutstandingBalance(totalAssessed, verifiedAmountPaid);

    // 5. Update database record
    await db.run(
      `UPDATE student_financial_accounts 
       SET verified_amount_paid = ?, 
           pending_amount_paid = ?, 
           outstanding_balance = ?, 
           payment_percentage = ?, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE student_id = ? AND semester_id = ?`,
      [verifiedAmountPaid, pendingAmountPaid, outstandingBalance, paymentPercentage, studentId, semesterId]
    );

    // 6. Fetch active milestones for this semester policy
    const policy = await db.getOne<any>(
      `SELECT * FROM semester_payment_policies WHERE semester_id = ? AND is_active = 1`,
      [semesterId]
    );

    let milestones: MilestoneEvaluation[] = [];
    if (policy) {
      const milestoneRows = await db.query<any>(
        `SELECT * FROM payment_milestones WHERE policy_id = ? AND is_active = 1 ORDER BY order_index ASC`,
        [policy.id]
      );

      milestones = milestoneRows.map((m) => {
        const reqPercent = Number(m.required_percentage);
        const achieved = paymentPercentage >= reqPercent;
        const deficitAmount = achieved
          ? 0
          : FinancialEngine.calculateDeficitForPercentage(totalAssessed, verifiedAmountPaid, reqPercent);

        return {
          id: m.id,
          name: m.name,
          requiredPercentage: reqPercent,
          achieved,
          deadline: m.deadline,
          deficitAmount,
        };
      });
    }

    return {
      assessedTuition: Number(account.assessed_tuition),
      otherAssessedFees: Number(account.other_assessed_fees),
      totalAssessed,
      verifiedAmountPaid,
      pendingAmountPaid,
      outstandingBalance,
      paymentPercentage,
      milestones,
    };
  }

  /**
   * Pure calculation helper for automated tests without database side effects
   */
  static evaluateScenario(assessedTuition: number, verifiedAmountPaid: number, requiredPercentage = 45) {
    const paymentPercentage = FinancialEngine.calculatePercentage(verifiedAmountPaid, assessedTuition);
    const outstandingBalance = FinancialEngine.calculateOutstandingBalance(assessedTuition, verifiedAmountPaid);
    const isEligible = paymentPercentage >= requiredPercentage;
    const deficitForEligibility = isEligible
      ? 0
      : FinancialEngine.calculateDeficitForPercentage(assessedTuition, verifiedAmountPaid, requiredPercentage);
    const deficitFor75 = FinancialEngine.calculateDeficitForPercentage(assessedTuition, verifiedAmountPaid, 75);
    const deficitFor100 = FinancialEngine.calculateDeficitForPercentage(assessedTuition, verifiedAmountPaid, 100);

    return {
      paymentPercentage,
      outstandingBalance,
      isEligible,
      deficitForEligibility,
      deficitFor75,
      deficitFor100,
    };
  }
}
