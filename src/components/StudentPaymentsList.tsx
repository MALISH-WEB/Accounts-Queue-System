import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileDown,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { generateUcuReceiptPdf } from '../lib/pdf-receipt';

interface StudentPaymentsListProps {
  studentId: string;
  onOpenMakePayment: () => void;
}

export const StudentPaymentsList: React.FC<StudentPaymentsListProps> = ({
  studentId,
  onOpenMakePayment,
}) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payData, recData] = await Promise.all([
        apiRequest<any[]>(`/payments?studentId=${studentId}`),
        apiRequest<any[]>('/receipts'),
      ]);
      setPayments(payData || []);
      setReceipts(recData || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const filteredPayments = payments.filter((p) => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      // Find matching receipt
      const rec = receipts.find((r) => r.payment_id === paymentId);
      if (!rec) {
        alert('Receipt is still generating or not yet available for this payment.');
        return;
      }

      // Fetch full details
      const fullReceipt = await apiRequest<any>(`/receipts/${rec.id}`);
      generateUcuReceiptPdf({
        receiptNumber: fullReceipt.receipt_number,
        studentName: fullReceipt.student_name,
        studentNumber: fullReceipt.student_number,
        registrationNumber: fullReceipt.registration_number,
        programme: fullReceipt.programme,
        faculty: fullReceipt.faculty,
        semesterName: fullReceipt.semester_name,
        amount: Number(fullReceipt.amount),
        currency: fullReceipt.currency || 'UGX',
        paymentMethod: fullReceipt.payment_method,
        transactionReference: fullReceipt.transaction_reference,
        paymentDate: fullReceipt.payment_date,
        verificationDate: fullReceipt.verification_date,
        verifiedByStaffName: fullReceipt.verified_by_staff_name || 'UCU Accounts Officer',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to download receipt');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with filters and new payment button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Tuition & Fee Payment History</h3>
          <p className="text-xs text-slate-500">
            Real-time status of submitted bank deposit slips, mobile money, and official receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filters */}
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs">
            {['ALL', 'VERIFIED', 'PENDING_VERIFICATION', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filter === st
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL'
                  ? 'All'
                  : st === 'PENDING_VERIFICATION'
                  ? 'Pending'
                  : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenMakePayment}
            className="px-3 py-1.5 bg-[#091E3A] hover:bg-[#132E52] text-white text-xs font-medium rounded-lg transition-colors"
          >
            + Submit Slip
          </button>
        </div>
      </div>

      {/* Table of Payments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading payment records...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No payment records found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Channel / Bank</th>
                  <th className="py-3 px-4">Amount (UGX)</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const isVerified = p.status === 'VERIFIED';
                  const isPending = p.status === 'PENDING_VERIFICATION';
                  const isRejected = p.status === 'REJECTED';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {p.payment_date}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#091E3A]">
                        {p.transaction_reference}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.payment_method?.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        UGX {Number(p.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            VERIFIED
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            PENDING REVIEW
                          </span>
                        )}
                        {isRejected && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              REJECTED
                            </span>
                            {p.rejection_reason && (
                              <p className="text-[10px] text-rose-600 mt-1 max-w-xs">
                                Reason: {p.rejection_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isVerified ? (
                          <button
                            onClick={() => handleDownloadReceipt(p.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#091E3A] hover:bg-[#132E52] text-white font-medium rounded-md text-xs shadow-2xs transition-colors"
                          >
                            <FileDown className="w-3.5 h-3.5 text-[#D4AF37]" />
                            Download PDF
                          </button>
                        ) : isPending ? (
                          <span className="text-[11px] text-slate-400 italic">
                            Generated upon verification
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-500 font-medium">
                            No receipt issued
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
    </div>
  );
};
