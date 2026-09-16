/**
 * CampusQ — UCU Accounts Office Registration Financial Eligibility Engine
 * Evaluates whether students meet the statutory 45% verified payment threshold
 * strictly within the Accounts Office mandate.
 */

import { db } from '../db/database.js';
import { FinancialEngine } from './financial-engine.js';
import { FinancialEligibilityResult, EligibilityStatus } from '../types/index.js';
import { findProgrammeFeeStructure } from '../data/programme-fee-structures.js';

export class EligibilityEngine {
  /**
   * Evaluate registration financial eligibility for a student in a semester
   */
  static async evaluateStudent(studentId: string, semesterId?: string): Promise<FinancialEligibilityResult> {
    // 1. Retrieve the student record with user details
    const student = await db.getOne<any>(
      `SELECT s.*, u.full_name, u.email 
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [studentId]
    );

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // 2. Retrieve active semester if not specified
    let targetSemesterId = semesterId;
    if (!targetSemesterId) {
      const currentSemester = await db.getOne<any>(
        `SELECT id, code, name FROM semesters WHERE is_current = 1 LIMIT 1`
      );
      if (!currentSemester) {
        throw new Error('No active semester configured in the system');
      }
      targetSemesterId = currentSemester.id;
    }

    const semester = await db.getOne<any>(
      `SELECT * FROM semesters WHERE id = ?`,
      [targetSemesterId]
    );

    // 3. Retrieve policy for the semester
    const policy = await db.getOne<any>(
      `SELECT * FROM semester_payment_policies WHERE semester_id = ? AND is_active = 1`,
      [targetSemesterId]
    );

    const requiredThreshold = Number(policy?.registration_threshold_percent || 45.0);

    // 4. Retrieve and recalculate financial account based on verified payments
    const finCalc = await FinancialEngine.recalculateStudentAccount(studentId, targetSemesterId);

    // 5. Check financial holds
    const hasFinancialHold = Boolean(student.has_financial_hold);
    const holdReason = student.financial_hold_reason;

    // 6. Evaluate eligibility condition
    // Must reach at least the configured threshold (45%) AND not have a financial hold
    const meetsPercentage = finCalc.paymentPercentage >= requiredThreshold;
    const isEligible = meetsPercentage && !hasFinancialHold;

    const amountNeededForEligibility = meetsPercentage
      ? 0
      : FinancialEngine.calculateDeficitForPercentage(
          finCalc.totalAssessed,
          finCalc.verifiedAmountPaid,
          requiredThreshold
        );

    // 7. Compose formal explanation with enrolled programme context
    const progStructure = findProgrammeFeeStructure(student.programme);
    let explanation = '';
    if (hasFinancialHold) {
      explanation = `Financial Registration: BLOCKED. An administrative Accounts Office hold is active on your ledger: "${holdReason || 'Accounts hold'}". Please consult the Senior Accounts Officer.`;
    } else if (isEligible) {
      explanation = `Financial Registration: ELIGIBLE. You have satisfied the mandatory ${requiredThreshold}% financial threshold for ${student.programme} with ${finCalc.paymentPercentage}% verified payment (UGX ${finCalc.verifiedAmountPaid.toLocaleString()} of your programme assessment UGX ${finCalc.totalAssessed.toLocaleString()}). You may proceed to course registration.`;
    } else {
      explanation = `Financial Registration: BLOCKED. For ${student.programme}, the total assessed semester fee is UGX ${finCalc.totalAssessed.toLocaleString()}. You have verified payments of UGX ${finCalc.verifiedAmountPaid.toLocaleString()} (${finCalc.paymentPercentage}%). Under UCU Policy, you require at least ${requiredThreshold}% (UGX ${progStructure.policyRegistration45.toLocaleString()}), leaving a deficit of UGX ${amountNeededForEligibility.toLocaleString()} before course registration opens.`;
    }

    return {
      studentNumber: student.student_number,
      studentName: student.full_name,
      programme: student.programme,
      semesterCode: semester?.code || targetSemesterId,
      assessedTuition: finCalc.totalAssessed,
      verifiedAmountPaid: finCalc.verifiedAmountPaid,
      currentPercentage: finCalc.paymentPercentage,
      requiredPercentage: requiredThreshold,
      outstandingBalance: finCalc.outstandingBalance,
      amountNeededForEligibility,
      eligibilityStatus: isEligible ? EligibilityStatus.ELIGIBLE : EligibilityStatus.BLOCKED,
      hasFinancialHold,
      financialHoldReason: holdReason,
      explanation,
      programmeFeeStructure: progStructure,
      milestones: finCalc.milestones.map((m) => ({
        name: m.name,
        targetPercent: m.requiredPercentage,
        achieved: m.achieved,
        deficitAmount: m.deficitAmount,
      })),
    };
  }
}
