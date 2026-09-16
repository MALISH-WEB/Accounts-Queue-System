import React, { useState, useEffect } from 'react';
import {
  Search,
  User,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  CreditCard,
  FileText
} from 'lucide-react';
import { apiRequest } from '../lib/api';

export const StudentLedgersLookup: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [eligibility, setEligibility] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Hold modal
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/students');
      setStudents(data || []);
      if (data && data.length > 0 && !selectedStudent) {
        selectStudent(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const selectStudent = async (stu: any) => {
    setSelectedStudent(stu);
    try {
      const elig = await apiRequest<any>(
        `/financial/registration-eligibility/check?studentId=${stu.id}`
      );
      setEligibility(elig);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !holdReason.trim()) return;

    setActionProcessing(true);
    try {
      await apiRequest(`/financial/hold/${selectedStudent.id}`, {
        method: 'POST',
        body: JSON.stringify({ reason: holdReason.trim() }),
      });
      setShowHoldModal(false);
      setHoldReason('');
      await loadStudents();
      await selectStudent(selectedStudent);
      alert('Administrative hold placed on student account.');
    } catch (err: any) {
      alert(err.message || 'Failed to place hold');
    } finally {
      setActionProcessing(false);
    }
  };

  const handleClearHold = async () => {
    if (!selectedStudent) return;
    if (!confirm(`Clear administrative financial hold on ${selectedStudent.full_name}?`)) return;

    setActionProcessing(true);
    try {
      await apiRequest(`/financial/hold/${selectedStudent.id}`, {
        method: 'DELETE',
      });
      await loadStudents();
      await selectStudent(selectedStudent);
      alert('Financial hold successfully cleared.');
    } catch (err: any) {
      alert(err.message || 'Failed to clear hold');
    } finally {
      setActionProcessing(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.registration_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left List of Students */}
      <div className="lg:col-span-4 space-y-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Student Academic Ledgers
          </h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name or reg #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map((s) => {
            const isSelected = selectedStudent?.id === s.id;
            return (
              <div
                key={s.id}
                onClick={() => selectStudent(s)}
                className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{s.full_name}</span>
                  {s.has_financial_hold ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                      HOLD
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">{s.registration_number}</span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-[#091E3A] font-semibold mt-0.5">
                  {s.student_number}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{s.programme}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Student Account Detail */}
      <div className="lg:col-span-8">
        {selectedStudent && eligibility ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedStudent.full_name}</h3>
                  {selectedStudent.has_financial_hold && (
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Financial Hold
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {selectedStudent.student_number} • Reg: {selectedStudent.registration_number} • {selectedStudent.faculty}
                </p>
                <p className="text-xs text-slate-600 font-medium">{selectedStudent.programme}</p>
              </div>

              {/* Hold Action Button */}
              <div>
                {selectedStudent.has_financial_hold ? (
                  <button
                    onClick={handleClearHold}
                    disabled={actionProcessing}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Clear Financial Hold
                  </button>
                ) : (
                  <button
                    onClick={() => setShowHoldModal(true)}
                    disabled={actionProcessing}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" /> Place Administrative Hold
                  </button>
                )}
              </div>
            </div>

            {/* Financial Status Summary */}
            <div
              className={`p-4 rounded-xl border ${
                eligibility.eligibilityStatus === 'ELIGIBLE'
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Course Registration Eligibility Status:
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    eligibility.eligibilityStatus === 'ELIGIBLE'
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {eligibility.eligibilityStatus}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-2">{eligibility.explanation}</p>
            </div>

            {/* Account Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500">Assessed Tuition</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  UGX {eligibility.assessedTuition.toLocaleString()}
                </div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Verified Paid</span>
                <div className="text-sm font-bold text-emerald-800 mt-0.5">
                  UGX {eligibility.verifiedAmountPaid.toLocaleString()}
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-blue-700">Payment %</span>
                <div className="text-sm font-bold text-blue-800 mt-0.5">
                  {eligibility.currentPercentage}%
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500">Balance</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  UGX {eligibility.outstandingBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Milestones Breakdown */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                Milestone Clearance Matrix
              </h4>
              <div className="space-y-2">
                {eligibility.milestones.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{m.name}</span>
                      <span className="text-[11px] text-slate-500 ml-2">Target: {m.targetPercent}%</span>
                    </div>
                    {m.achieved ? (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
                      </span>
                    ) : (
                      <span className="font-bold text-amber-700">
                        Deficit: UGX {m.deficitAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500">Select a student to view academic ledger</p>
          </div>
        )}
      </div>

      {/* Place Hold Modal */}
      {showHoldModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Place Administrative Financial Hold</h3>
            <p className="text-xs text-slate-500 mt-1">
              Applying a hold on <strong>{selectedStudent.full_name}</strong> ({selectedStudent.student_number}) will strictly block course registration and academic document release until cleared.
            </p>

            <form onSubmit={handleApplyHold} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Hold *
                </label>
                <textarea
                  required
                  rows={3}
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="e.g. Unverified bank draft, pending sponsor confirmation, disciplinary surcharge..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHoldModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Confirm Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
