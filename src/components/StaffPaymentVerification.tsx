import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Search,
  DollarSign,
  User,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../lib/api';

export const StaffPaymentVerification: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState('PENDING_VERIFICATION');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Reject modal state
  const [rejectingPayment, setRejectingPayment] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Verification notes
  const [verificationNotes, setVerificationNotes] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/payments');
      setPayments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleVerify = async (paymentId: string) => {
    if (!confirm('Confirm and verify this tuition payment? This will update the student ledger, calculate registration milestone %, and generate an official electronic receipt.')) {
      return;
    }

    setProcessing(true);
    try {
      await apiRequest(`/payments/verification/${paymentId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Verified against bank collection statement' }),
      });
      alert('Payment successfully verified and official receipt generated.');
      await loadPayments();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment || !rejectionReason.trim()) return;

    setProcessing(true);
    try {
      await apiRequest(`/payments/verification/${rejectingPayment.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      setRejectingPayment(null);
      setRejectionReason('');
      await loadPayments();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = payments.filter((p) => {
    const matchesFilter = filter === 'ALL' || p.status === filter;
    const matchesSearch =
      !search ||
      p.transaction_reference?.toLowerCase().includes(search.toLowerCase()) ||
      p.student_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.student_name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = payments.filter((p) => p.status === 'PENDING_VERIFICATION').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Payment Verification Desk</h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Accounts Officers audit bank transaction references, verify deposit receipts, and authorize ledger credits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ref or student #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none w-48"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg text-xs">
            {['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'ALL'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  filter === st
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'PENDING_VERIFICATION' ? 'Pending' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table of Submissions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading payment submissions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No payment submissions found under this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Transaction Reference</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Amount (UGX)</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const isPending = p.status === 'PENDING_VERIFICATION';
                  const isVerified = p.status === 'VERIFIED';
                  const isRejected = p.status === 'REJECTED';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.student_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{p.student_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-[#091E3A]">{p.transaction_reference}</div>
                        {p.proof_document_url && (
                          <a
                            href={p.proof_document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3" /> View Deposit Slip
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.payment_method?.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        UGX {Number(p.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {p.payment_date}
                      </td>
                      <td className="py-3 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleVerify(p.id)}
                              disabled={processing}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-xs shadow-2xs transition-colors"
                            >
                              Verify & Credit
                            </button>
                            <button
                              onClick={() => setRejectingPayment(p)}
                              disabled={processing}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-md text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : isVerified ? (
                          <span className="text-[11px] text-slate-500">
                            Verified by {p.verified_by_staff_name || 'Staff'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-600 max-w-xs block text-right">
                            {p.rejection_reason}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formal Rejection Modal */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Formal Payment Rejection</h3>
            <p className="text-xs text-slate-500 mt-1">
              Document the formal audit reason for rejecting payment reference{' '}
              <strong>{rejectingPayment.transaction_reference}</strong> (UGX{' '}
              {Number(rejectingPayment.amount).toLocaleString()}) of student {rejectingPayment.student_name}.
            </p>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Deposit reference not reflected on Stanbic bank statement; depositor name mismatch; duplicate voucher..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingPayment(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
