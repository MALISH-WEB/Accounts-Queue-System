import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Users,
  AlertOctagon,
  Clock,
  DollarSign,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Award
} from 'lucide-react';
import { apiRequest } from '../lib/api';

export const SupervisorReports: React.FC = () => {
  const [avoidanceData, setAvoidanceData] = useState<any | null>(null);
  const [financialHealth, setFinancialHealth] = useState<any | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<any | null>(null);
  const [lateCharges, setLateCharges] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningBatch, setRunningBatch] = useState(false);

  // Waive modal
  const [waivingCharge, setWaivingCharge] = useState<any | null>(null);
  const [waiverReason, setWaiverReason] = useState('');
  const [waiving, setWaiving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [avoidRes, finRes, qRes, lateRes, auditRes] = await Promise.all([
        apiRequest<any>('/reports/physical-visits-avoided'),
        apiRequest<any>('/reports/financial-health'),
        apiRequest<any>('/reports/queue-performance'),
        apiRequest<any[]>('/financial/late-charges'),
        apiRequest<any[]>('/reports/audit-logs'),
      ]);
      setAvoidanceData(avoidRes);
      setFinancialHealth(finRes);
      setQueueMetrics(qRes);
      setLateCharges(lateRes || []);
      setAuditLogs(auditRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRunLateChargeBatch = async () => {
    if (!confirm('Run automated statutory late payment charge evaluation for Easter 2026? This will assess policy late fees for students with balances past statutory deadline.')) {
      return;
    }

    setRunningBatch(true);
    try {
      const res = await apiRequest<any>('/financial/late-charges/evaluate-batch', {
        method: 'POST',
        body: JSON.stringify({ semesterId: 'SEM_EASTER_2026' }),
      });
      alert(`Batch evaluation complete. ${res.assessedCount} accounts assessed. Total charges: UGX ${res.totalAssessedAmount?.toLocaleString()}`);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Batch evaluation failed');
    } finally {
      setRunningBatch(false);
    }
  };

  const handleConfirmWaive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waivingCharge || !waiverReason.trim()) return;

    setWaiving(true);
    try {
      await apiRequest(`/financial/late-charges/${waivingCharge.id}/waive`, {
        method: 'POST',
        body: JSON.stringify({ reason: waiverReason.trim() }),
      });
      alert('Late payment charge successfully waived.');
      setWaivingCharge(null);
      setWaiverReason('');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Waiver failed');
    } finally {
      setWaiving(false);
    }
  };

  if (loading && !avoidanceData) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-xs text-slate-500">Loading supervisor executive analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-[#091E3A] text-white p-6 rounded-xl border border-[#1E3A60] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#C69214] text-[#091E3A]">
            Executive Directorate View
          </span>
          <h2 className="text-xl font-bold mt-2">UCU Accounts Office Strategic Operations</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time analytics measuring physical visit reduction, digital service adoption, statutory tuition collection, and late surcharge compliance.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#102A4C] hover:bg-[#183966] text-white border border-[#1E3A60] transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#C69214]" />
          Refresh Metrics
        </button>
      </div>

      {/* 2. Physical Visits Avoided Showcase Card */}
      {avoidanceData && (
        <div className="bg-gradient-to-r from-emerald-900 via-[#0B3A2C] to-[#091E3A] text-white p-6 rounded-2xl shadow-lg border border-emerald-700/40">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                  Digital Transformation Impact
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {avoidanceData.visitsAvoidedCount} In-Person Visits Prevented
              </h3>
              <p className="text-xs text-emerald-100 mt-1 max-w-xl leading-relaxed">
                By enabling online 45% registration clearance checking, digital slip submissions, and electronic receipts, CampusQ has eliminated crowded in-person queues at the Mukono campus accounts hall.
              </p>
            </div>

            <div className="bg-[#051F17]/80 px-6 py-4 rounded-xl border border-emerald-500/30 text-center shrink-0">
              <span className="text-xs uppercase font-bold text-emerald-300 block">
                Physical Avoidance Rate
              </span>
              <span className="text-4xl font-black text-[#D4AF37] block mt-1">
                {avoidanceData.avoidanceRatePercentage}%
              </span>
              <span className="text-[11px] text-emerald-200">
                Of total {avoidanceData.totalStudentInteractions} student interactions handled online
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Core Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Assessed Semester Fees</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            UGX {financialHealth?.totalAssessedTuition?.toLocaleString() || '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all registered programmes</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase">Verified Collections</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            UGX {financialHealth?.totalVerifiedCollections?.toLocaleString() || '0'}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {financialHealth?.overallCollectionRate}% collection rate
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase">Registration Clearance</span>
          <div className="text-xl font-bold text-blue-800 mt-1">
            {financialHealth?.studentsEligibleCount} / {financialHealth?.totalStudents} Students
          </div>
          <p className="text-[11px] text-blue-600 font-medium mt-1">
            ≥45% statutory threshold met
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase">Queue Performance</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {queueMetrics?.averageWaitTimeMinutes || 4} min wait
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {queueMetrics?.completedToday || 8} tickets served today
          </p>
        </div>
      </div>

      {/* 4. Statutory Late-Payment Surcharge Policy Engine */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Statutory Late-Payment Charges Policy Engine
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Automatic statutory late fee assessments (UGX 50,000 / UGX 100,000) applied post-deadline. Supervisors can execute batch evaluations or issue documented waivers.
            </p>
          </div>

          <button
            onClick={handleRunLateChargeBatch}
            disabled={runningBatch}
            className="px-4 py-2 bg-[#091E3A] hover:bg-[#132E52] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {runningBatch ? 'Evaluating...' : 'Run Automated Policy Batch'}
          </button>
        </div>

        {/* Late charges list */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Overdue Balance</th>
                <th className="py-2.5 px-3">Days Overdue</th>
                <th className="py-2.5 px-3">Late Charge (UGX)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lateCharges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    No statutory late charges assessed for this period.
                  </td>
                </tr>
              ) : (
                lateCharges.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{ch.student_name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{ch.student_number}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      UGX {Number(ch.overdue_balance).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{ch.days_overdue} days</td>
                    <td className="py-2.5 px-3 font-bold text-rose-700">
                      UGX {Number(ch.charge_amount).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ch.status === 'WAIVED'
                            ? 'bg-slate-100 text-slate-700'
                            : ch.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ch.status}
                      </span>
                      {ch.waiver_reason && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Waived: {ch.waiver_reason}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {ch.status === 'ASSESSED' && (
                        <button
                          onClick={() => setWaivingCharge(ch)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md transition-colors"
                        >
                          Waive Surcharge
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Immutable Accounts Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[#091E3A]" />
          Directorate Immutable Financial Audit Trail
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          All financial verifications, status transitions, holds, and fee waivers are logged permanently with staff identity and timestamp.
        </p>

        <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 hover:bg-slate-50 flex items-start justify-between">
              <div>
                <span className="font-bold text-[#091E3A] font-mono text-[11px] mr-2">
                  {log.action}
                </span>
                <span className="font-semibold text-slate-800">{log.entity_type}</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Actor: <strong>{log.actor_name}</strong> ({log.actor_role})
                </p>
                {log.details && (
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.details}</p>
                )}
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {new Date(log.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Waive Modal */}
      {waivingCharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Authorize Statutory Surcharge Waiver</h3>
            <p className="text-xs text-slate-500 mt-1">
              Waiving the UGX {Number(waivingCharge.charge_amount).toLocaleString()} late charge for student{' '}
              <strong>{waivingCharge.student_name}</strong> requires an official audited justification.
            </p>

            <form onSubmit={handleConfirmWaive} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Justification / Academic Board Approval Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  placeholder="e.g. Validated medical admission at Bishop Tucker Dispensary; sponsor delay acknowledged by Ministry of Education..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWaivingCharge(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={waiving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Confirm Waiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
