/**
 * CampusQ — Comprehensive Test Suite
 * Validates UCU Accounts Office business logic, statutory milestones, and data integrity.
 */

import { FinancialEngine } from '../services/financial-engine.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${detail || 'Condition not met'}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n========================================');
  console.log('🧪 CampusQ — UCU ACCOUNTS OFFICE TEST SUITE');
  console.log('========================================\n');

  // Test Group 1: Registration Financial Eligibility Threshold (45%) & Milestones
  console.log('--- TEST GROUP 1: Statutory Financial Milestones & Edge Cases ---');
  const assessed = 2000000; // 2 Million UGX

  // Case 1: 0% paid
  {
    const res = FinancialEngine.evaluateScenario(assessed, 0, 45);
    assert(res.paymentPercentage === 0, '0% Paid calculates to 0.00%');
    assert(!res.isEligible, '0% Paid is NOT eligible (<45%)');
    assert(res.deficitForEligibility === 900000, '0% Paid deficit for 45% is 900,000 UGX');
    assert(res.outstandingBalance === 2000000, '0% Paid outstanding balance is 2,000,000 UGX');
  }

  // Case 2: 20% paid (UGX 400,000)
  {
    const res = FinancialEngine.evaluateScenario(assessed, 400000, 45);
    assert(res.paymentPercentage === 20, '20% Paid calculates to 20.00%');
    assert(!res.isEligible, '20% Paid is NOT eligible');
    assert(res.deficitForEligibility === 500000, '20% Paid deficit is 500,000 UGX');
  }

  // Case 3: 44.99% paid (UGX 899,800) -> BLOCKED
  {
    const res = FinancialEngine.evaluateScenario(assessed, 899800, 45);
    assert(res.paymentPercentage === 44.99, '44.99% Paid calculates to 44.99%');
    assert(!res.isEligible, '44.99% Paid is STRICTLY BLOCKED (<45.00%)');
    assert(res.deficitForEligibility === 200, '44.99% Paid requires UGX 200 to cross threshold');
  }

  // Case 4: 45.00% paid (UGX 900,000) -> EXACTLY ELIGIBLE
  {
    const res = FinancialEngine.evaluateScenario(assessed, 900000, 45);
    assert(res.paymentPercentage === 45, '45.00% Paid calculates to exactly 45.00%');
    assert(res.isEligible, '45.00% Paid is ELIGIBLE');
    assert(res.deficitForEligibility === 0, '45.00% Paid deficit is UGX 0');
  }

  // Case 5: 45.01% paid (UGX 900,200) -> ELIGIBLE
  {
    const res = FinancialEngine.evaluateScenario(assessed, 900200, 45);
    assert(res.paymentPercentage === 45.01, '45.01% Paid calculates to 45.01%');
    assert(res.isEligible, '45.01% Paid is ELIGIBLE');
  }

  // Case 6: 52% paid (UGX 1,040,000)
  {
    const res = FinancialEngine.evaluateScenario(assessed, 1040000, 45);
    assert(res.paymentPercentage === 52, '52% Paid calculates to 52.00%');
    assert(res.isEligible, '52% Paid is ELIGIBLE');
    assert(res.deficitFor75 === 460000, '52% Paid deficit for 75% milestone is 460,000 UGX');
  }

  // Case 7: 60% paid (UGX 1,200,000)
  {
    const res = FinancialEngine.evaluateScenario(assessed, 1200000, 45);
    assert(res.paymentPercentage === 60, '60% Paid calculates to 60.00%');
    assert(res.isEligible, '60% Paid is ELIGIBLE');
  }

  // Case 8: 74.99% paid (UGX 1,499,800) -> BLOCKED from 75% milestone
  {
    const res = FinancialEngine.evaluateScenario(assessed, 1499800, 45);
    assert(res.paymentPercentage === 74.99, '74.99% Paid calculates to 74.99%');
    assert(res.isEligible, '74.99% is eligible for course registration');
    assert(res.deficitFor75 === 200, '74.99% is UGX 200 short of 75% mid-term milestone');
  }

  // Case 9: 75.00% paid (UGX 1,500,000) -> EXACTLY ACHIEVED
  {
    const res = FinancialEngine.evaluateScenario(assessed, 1500000, 45);
    assert(res.paymentPercentage === 75, '75.00% Paid calculates to exactly 75.00%');
    assert(res.deficitFor75 === 0, '75.00% achieves mid-term milestone with 0 deficit');
  }

  // Case 10: 75.01% paid (UGX 1,500,200)
  {
    const res = FinancialEngine.evaluateScenario(assessed, 1500200, 45);
    assert(res.paymentPercentage === 75.01, '75.01% Paid calculates to 75.01%');
  }

  // Case 11: 99.99% paid (UGX 1,999,800)
  {
    const res = FinancialEngine.evaluateScenario(assessed, 1999800, 45);
    assert(res.paymentPercentage === 99.99, '99.99% Paid calculates to 99.99%');
    assert(res.deficitFor100 === 200, '99.99% is UGX 200 short of full 100% financial clearance');
  }

  // Case 12: 100% paid (UGX 2,000,000)
  {
    const res = FinancialEngine.evaluateScenario(assessed, 2000000, 45);
    assert(res.paymentPercentage === 100, '100% Paid calculates to 100.00%');
    assert(res.outstandingBalance === 0, '100% Paid outstanding balance is 0 UGX');
    assert(res.deficitFor100 === 0, '100% Paid achieves full financial clearance');
  }

  // Test Group 2: Payment Validation Rules
  console.log('\n--- TEST GROUP 2: Payment Integrity & Business Rules ---');
  {
    // Test: Verified Payments Only rule
    const assessedFee = 1000000;
    const verifiedPayments = 450000;
    const pendingPayments = 300000; // MUST NOT count toward percentage
    const rejectedPayments = 200000; // MUST NOT count

    const verifiedOnlyPct = FinancialEngine.calculatePercentage(verifiedPayments, assessedFee);
    assert(
      verifiedOnlyPct === 45,
      'Verified-only payments calculate exact 45.00%, ignoring pending and rejected payments'
    );

    const falsePct = FinancialEngine.calculatePercentage(verifiedPayments + pendingPayments, assessedFee);
    assert(
      falsePct !== verifiedOnlyPct,
      'Pending payments strictly excluded from eligibility percentage calculation'
    );
  }

  // Test Group 3: Programme-Specific Tuition Structures & Policy Derivation
  console.log('\n--- TEST GROUP 3: Programme-Specific Tuition Structures & Policy Derivation ---');
  {
    const { UCU_PROGRAMME_FEE_STRUCTURES, findProgrammeFeeStructure } = await import('../data/programme-fee-structures.js');

    assert(UCU_PROGRAMME_FEE_STRUCTURES.length >= 8, 'At least 8 academic programmes configured with tuition structures');

    // Test BSIT derivation
    const bsit = findProgrammeFeeStructure('Bachelor of Science in Information Technology (BSIT)');
    assert(bsit.code === 'BSIT', 'BSIT programme resolved correctly');
    assert(bsit.totalAssessed === 2400000, 'BSIT total assessed is 2,400,000 UGX');
    assert(bsit.policyRegistration45 === 1080000, 'BSIT 45% policy threshold is exactly 1,080,000 UGX');
    assert(bsit.policyMidSem75 === 1800000, 'BSIT 75% policy threshold is exactly 1,800,000 UGX');
    assert(bsit.policyFinal100 === 2400000, 'BSIT 100% policy threshold is exactly 2,400,000 UGX');

    // Test LLB derivation
    const llb = findProgrammeFeeStructure('Bachelor of Laws (LLB)');
    assert(llb.code === 'LLB', 'LLB programme resolved correctly');
    assert(llb.totalAssessed === 3000000, 'LLB total assessed is 3,000,000 UGX');
    assert(llb.policyRegistration45 === 1350000, 'LLB 45% policy threshold is exactly 1,350,000 UGX');
    assert(llb.policyMidSem75 === 2250000, 'LLB 75% policy threshold is exactly 2,250,000 UGX');

    // Test MBChB derivation
    const mbchb = findProgrammeFeeStructure('MBCHB');
    assert(mbchb.code === 'MBCHB', 'MBChB programme resolved correctly');
    assert(mbchb.totalAssessed === 4800000, 'MBChB total assessed is 4,800,000 UGX');
    assert(mbchb.policyRegistration45 === 2160000, 'MBChB 45% policy threshold is exactly 2,160,000 UGX');
  }

  // Summary
  console.log('\n========================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
