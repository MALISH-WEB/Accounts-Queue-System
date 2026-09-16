import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  Calculator,
  GraduationCap,
  Building2,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  Award
} from 'lucide-react';
import { FinancialEligibilityResult } from '../types';
import { findProgrammeFeeStructure } from '../data/programme-fee-structures';
import { UCULogo } from './UCULogo';

interface StudentFinancialOverviewProps {
  eligibility: FinancialEligibilityResult | null;
  account: any | null;
  onOpenMakePayment: () => void;
  onRequestAssistance: () => void;
  onRefresh: () => void;
  onViewAllProgrammes?: () => void;
  onOpenRegistration?: () => void;
}

export const StudentFinancialOverview: React.FC<StudentFinancialOverviewProps> = ({
  eligibility,
  account,
  onOpenMakePayment,
  onRequestAssistance,
  onRefresh: _onRefresh,
  onViewAllProgrammes,
  onOpenRegistration,
}) => {
  const [calculatorPayment, setCalculatorPayment] = useState<number>(500000);

  if (!eligibility) {
    return (
      <div className="p-12 text-center bg-white rounded-xl shadow-xs border border-slate-200">
        <div className="animate-spin w-8 h-8 border-3 border-[#091E3A] border-t-[#C69214] rounded-full mx-auto" />
        <p className="mt-4 text-xs font-semibold text-[#1E293B]">Retrieving statutory student ledger from UCU Accounts...</p>
      </div>
    );
  }

  const isEligible = eligibility.eligibilityStatus === 'ELIGIBLE';
  const hasHold = eligibility.hasFinancialHold;
  const verifiedPercentage = eligibility.currentPercentage;
  const assessedTotal = eligibility.assessedTuition;
  const verifiedPaid = eligibility.verifiedAmountPaid;
  const pendingAmount = Number(account?.pending_amount_paid || 0);
  const outstandingBal = eligibility.outstandingBalance;

  // Retrieve or fallback programme fee structure
  const progStructure =
    eligibility.programmeFeeStructure || findProgrammeFeeStructure(eligibility.programme);

  // Simulator calculation
  const simulatedVerified = verifiedPaid + (Number(calculatorPayment) || 0);
  const simulatedPercentage = Math.min(100, Math.round((simulatedVerified / Math.max(1, assessedTotal)) * 10000) / 100);
  const simulatedMeets45 = simulatedPercentage >= 45.0;

  return (
    <div className="space-y-6">
      {/* 1. Administrative Financial Hold Banner if active */}
      {hasHold && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-xl shadow-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-900">Administrative Financial Hold Active</h4>
            <p className="text-xs text-rose-700 mt-1">
              Reason: <strong>{eligibility.financialHoldReason || 'Accounts hold applied'}</strong>. Course registration and official document release remain blocked until cleared by the Senior Accounts Officer.
            </p>
            <button
              onClick={onRequestAssistance}
              className="mt-2 text-xs font-semibold text-rose-800 underline hover:text-rose-950"
            >
              Open a ticket with the Accounts Office to resolve this hold &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 2. Enrolled Programme Fee Structure Card with Official UCU Crest */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
        {/* Subtle UCU brand gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#091E3A] via-[#E6007E] to-[#FFCC00]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            {/* Official UCU Shield Crest Container */}
            <div className="w-12 h-12 flex items-center justify-center shrink-0 drop-shadow-xs">
              <UCULogo size={46} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#091E3A] text-[#FFD700] border border-[#1E3A60]">
                  {progStructure.code}
                </span>
                <span className="text-[11px] font-medium text-[#475569]">
                  {progStructure.campus}
                </span>
                {/* UCU Green: Growth & Life */}
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  Active Enrolled Programme
                </span>
                {/* Episcopal Magenta Accent Tag */}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FDF2F8] text-[#BE0061] border border-[#FBCFE8]">
                  Crest Certified
                </span>
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mt-1">
                {eligibility.programme}
              </h3>
              <p className="text-xs text-[#334155] flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-[#C69214]" />
                {progStructure.faculty}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewAllProgrammes && (
              <button
                onClick={onViewAllProgrammes}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-[#091E3A] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5 text-[#C69214]" />
                Browse All Programmes & Policies
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Programme Fee Breakdown & Policy Derivation */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 space-y-2 bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/90 text-xs">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#334155] block">
              Assessed Tuition Structure ({progStructure.code})
            </span>
            <div className="flex justify-between text-[#1E293B]">
              <span>Instruction Tuition:</span>
              <span className="font-semibold text-[#0F172A]">UGX {progStructure.tuitionFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#1E293B]">
              <span>Functional Fees (Exam, ICT, Clinic, Guild):</span>
              <span className="font-semibold text-[#0F172A]">UGX {progStructure.functionalFees.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-[#0F172A]">
              <span>Total Semester Assessment:</span>
              <span className="text-[#091E3A] text-sm">UGX {progStructure.totalAssessed.toLocaleString()}</span>
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col justify-between space-y-2 text-xs">
            <p className="text-[#334155] leading-relaxed">
              <strong className="text-[#0F172A]">Statutory Policy Application:</strong> In accordance with UCU Senate Financial Policy, your statutory clearance thresholds are calculated from your assessed total of <strong className="text-[#091E3A]">UGX {progStructure.totalAssessed.toLocaleString()}</strong>:
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              {/* 45% Milestone: UCU Deep Blue / Gold */}
              <div className="p-2.5 rounded-lg bg-[#091E3A]/5 border border-[#091E3A]/20">
                <span className="font-bold text-[#091E3A] block text-[10px] uppercase">45% Threshold</span>
                <span className="font-extrabold text-[#091E3A] text-xs mt-0.5 block">
                  UGX {progStructure.policyRegistration45.toLocaleString()}
                </span>
                <span className="text-[9px] text-[#475569] mt-0.5 block font-medium">Course Registration</span>
              </div>

              {/* 75% Milestone: UCU Gold (Excellence) */}
              <div className="p-2.5 rounded-lg bg-[#FEF9C3]/80 border border-[#FDE047]">
                <span className="font-bold text-[#854D0E] block text-[10px] uppercase">75% Milestone</span>
                <span className="font-extrabold text-[#854D0E] text-xs mt-0.5 block">
                  UGX {progStructure.policyMidSem75.toLocaleString()}
                </span>
                <span className="text-[9px] text-[#92400E] mt-0.5 block font-medium">Mid-Sem Exam Card</span>
              </div>

              {/* 100% Milestone: UCU Green (Growth & Sustainability) */}
              <div className="p-2.5 rounded-lg bg-[#DCFCE7]/80 border border-[#86EFAC]">
                <span className="font-bold text-[#14532D] block text-[10px] uppercase">100% Clearance</span>
                <span className="font-extrabold text-[#14532D] text-xs mt-0.5 block">
                  UGX {progStructure.policyFinal100.toLocaleString()}
                </span>
                <span className="text-[9px] text-[#15803D] mt-0.5 block font-medium">Final Exam Permit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Status Card: Registration Financial Eligibility (Green for Eligible, Gold/Amber for Pending) */}
      <div
        className={`rounded-xl border p-6 shadow-sm transition-all ${
          isEligible
            ? 'bg-gradient-to-br from-[#DCFCE7]/60 via-white to-white border-[#86EFAC]'
            : 'bg-gradient-to-br from-[#FEF9C3]/50 via-white to-white border-[#FDE047]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {/* Status Icon with UCU Green or Gold */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isEligible ? 'bg-[#15803D] text-white' : 'bg-[#C69214] text-[#091E3A]'
              }`}
            >
              {isEligible ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isEligible
                      ? 'bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]' // UCU Green
                      : 'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]' // UCU Gold
                  }`}
                >
                  {isEligible ? 'REGISTRATION ELIGIBLE' : 'REGISTRATION BLOCKED (<45%)'}
                </span>
                <span className="text-xs text-[#475569] font-medium">
                  Semester: {eligibility.semesterCode}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] mt-1">
                {isEligible ? 'Mandatory 45% Financial Threshold Satisfied' : 'Tuition Requirement Below 45% Threshold'}
              </h2>
              <p className="text-xs text-[#334155] mt-1 max-w-2xl leading-relaxed">
                {eligibility.explanation}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
            {onOpenRegistration && (
              <button
                onClick={onOpenRegistration}
                className="px-4 py-2 bg-[#091E3A] hover:bg-[#102A4C] text-[#E5B53B] text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              >
                <Award className="w-4 h-4 text-[#E5B53B]" />
                Course Registration & Stamp &rarr;
              </button>
            )}
            {/* UCU Gold Action Button */}
            <button
              onClick={onOpenMakePayment}
              className="px-4 py-2 bg-gradient-to-r from-[#C69214] to-[#E5B53B] hover:from-[#B38012] hover:to-[#D4AF37] text-[#091E3A] text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4 text-[#091E3A]" />
              Submit Payment Slip
            </button>
            <button
              onClick={onRequestAssistance}
              className="px-3 py-1.5 text-xs text-[#334155] hover:text-[#091E3A] font-medium transition-colors"
            >
              Request Accounts Review
            </button>
          </div>
        </div>

        {/* Progress Meter: 45% (Registration) -> 75% (Mid-Sem) -> 100% (Full Clearance) */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-[#1E293B]">Verified Payment Progress</span>
            <span className="font-extrabold text-[#091E3A] text-sm font-mono">
              {verifiedPercentage.toFixed(2)}%
            </span>
          </div>

          {/* Visual Progress Bar with UCU Brand Colors */}
          <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                verifiedPercentage >= 100
                  ? 'bg-[#15803D]' // UCU Green for full completion
                  : verifiedPercentage >= 45
                  ? 'bg-gradient-to-r from-[#091E3A] to-[#132E52]' // UCU Deep Blue
                  : 'bg-gradient-to-r from-[#C69214] to-[#E5B53B]' // UCU Gold for in-progress
              }`}
              style={{ width: `${Math.min(100, verifiedPercentage)}%` }}
            />
            {/* 45% Statutory Marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-[#C69214] z-10 shadow-xs"
              style={{ left: '45%' }}
              title="Statutory Course Registration Threshold (45%)"
            />
            {/* 75% Milestone Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#091E3A] z-10 opacity-70"
              style={{ left: '75%' }}
              title="Mid-Semester Exam Milestone (75%)"
            />
          </div>

          {/* Milestone Labels */}
          <div className="relative mt-2 text-[11px] font-medium text-[#475569] flex justify-between">
            <div className="text-left">
              <span>0% Start</span>
            </div>
            <div className="text-center font-bold">
              <span className={verifiedPercentage >= 45 ? 'text-[#15803D]' : 'text-[#854D0E]'}>
                ▲ 45% Registration {verifiedPercentage >= 45 ? '(Achieved)' : '(Required)'}
              </span>
            </div>
            <div className="text-center">
              <span className={verifiedPercentage >= 75 ? 'text-[#15803D] font-bold' : ''}>
                ▲ 75% Mid-Semester
              </span>
            </div>
            <div className="text-right">
              <span className={verifiedPercentage >= 100 ? 'text-[#15803D] font-bold' : ''}>
                100% Full Clearance
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Financial Tally Cards with Charcoal Numbers & Brand Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assessed Tuition: Deep Blue Accent */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-t-3 border-t-[#091E3A]">
          <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
            Total Assessed Fees
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xs font-bold text-[#64748B]">UGX</span>
            <span className="text-xl font-bold text-[#0F172A]">{assessedTotal.toLocaleString()}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#475569]">Official semester ledger assessment</p>
        </div>

        {/* Verified Paid: UCU Green (Growth & Life) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-t-3 border-t-[#15803D]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#15803D] uppercase tracking-wider">
              Verified Paid (Eligible)
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xs font-bold text-[#15803D]">UGX</span>
            <span className="text-xl font-bold text-[#14532D]">{verifiedPaid.toLocaleString()}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#15803D] font-medium">Counts toward statutory %</p>
        </div>

        {/* Pending Verification: UCU Gold (Guiding Review) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-t-3 border-t-[#C69214]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#854D0E] uppercase tracking-wider">
              Pending Review
            </span>
            <Clock className="w-4 h-4 text-[#C69214]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xs font-bold text-[#854D0E]">UGX</span>
            <span className="text-xl font-bold text-[#854D0E]">{pendingAmount.toLocaleString()}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#854D0E]">
            Awaiting Accounts staff review
          </p>
        </div>

        {/* Outstanding Balance: Charcoal / Gold */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-t-3 border-t-[#1E293B]">
          <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
            Outstanding Balance
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xs font-bold text-[#64748B]">UGX</span>
            <span className="text-xl font-bold text-[#0F172A]">{outstandingBal.toLocaleString()}</span>
          </div>
          <p className="mt-1 text-[11px]">
            {eligibility.amountNeededForEligibility > 0 ? (
              <span className="text-rose-600 font-semibold">
                UGX {eligibility.amountNeededForEligibility.toLocaleString()} needed for 45%
              </span>
            ) : (
              <span className="text-[#15803D] font-semibold">
                Registration requirement met
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 5. Statutory Payment Milestones Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#091E3A]" />
          Statutory Payment Milestones & Academic Permits
        </h3>
        <p className="text-xs text-[#475569] mt-1">
          Uganda Christian University payment milestones govern academic course registration, examination cards, and final clearance.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {eligibility.milestones.map((m, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                m.achieved
                  ? 'bg-[#DCFCE7]/50 border-[#86EFAC]' // UCU Green: Growth & Success
                  : 'bg-slate-50/90 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A]">{m.name}</span>
                {m.achieved ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]">
                    Achieved
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]">
                    Deficit: UGX {m.deficitAmount.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-[#1E293B]">
                Target: <strong className="text-[#091E3A]">{m.targetPercent}%</strong> of assessed tuition
              </div>
              <div className="mt-1 text-[11px] text-[#475569]">
                {m.achieved
                  ? 'Requirement satisfied. Academic milestone unlocked.'
                  : `Pay UGX ${m.deficitAmount.toLocaleString()} to clear this threshold.`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Interactive Milestone & Clearance Calculator */}
      <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#C69214]" />
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Payment & Milestone Simulator
          </h3>
        </div>
        <p className="text-xs text-[#475569] mt-1">
          Estimate how an upcoming bank deposit slip or mobile money receipt will advance your registration eligibility standing.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-64">
            <label className="text-[11px] font-semibold text-[#1E293B] block mb-1">
              Simulated Payment Amount (UGX)
            </label>
            <input
              type="number"
              step="50000"
              value={calculatorPayment}
              onChange={(e) => setCalculatorPayment(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#091E3A]"
            />
          </div>

          <div className="flex-1 w-full bg-white p-3.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
            <div className="flex justify-between items-center">
              <span className="text-[#475569]">Simulated Verified Paid:</span>
              <span className="font-bold text-[#0F172A]">UGX {simulatedVerified.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-[#475569]">Projected Percentage:</span>
              <span className="font-bold text-[#091E3A] font-mono text-sm">{simulatedPercentage}%</span>
            </div>
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-[#475569]">Registration Standing:</span>
              <span className={`font-bold ${simulatedMeets45 ? 'text-[#15803D]' : 'text-[#854D0E]'}`}>
                {simulatedMeets45 ? 'Eligible (≥45%)' : 'Still Blocked (<45%)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
