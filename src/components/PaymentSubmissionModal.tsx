import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { UCULogo } from './UCULogo';

interface PaymentSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSubmitted: () => void;
  studentId: string;
}

export const PaymentSubmissionModal: React.FC<PaymentSubmissionModalProps> = ({
  isOpen,
  onClose,
  onPaymentSubmitted,
  studentId,
}) => {
  const [method, setMethod] = useState('STANBIC_BANK_DEPOSIT');
  const [transactionRef, setTransactionRef] = useState('');
  const [amount, setAmount] = useState<string>('900000');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMessage('Payment amount must be a positive number greater than 0 UGX.');
      return;
    }

    if (!transactionRef.trim()) {
      setErrorMessage('Transaction reference / Bank slip number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          semesterId: 'SEM_EASTER_2026',
          transactionReference: transactionRef.trim(),
          amount: numAmount,
          paymentDate,
          paymentMethod: method,
          notes: notes.trim() || undefined,
          proofDocumentUrl: proofUrl,
        }),
      });

      setSuccessMessage('Payment submitted successfully! It has been queued for Accounts staff verification.');
      setTimeout(() => {
        onPaymentSubmitted();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment submission failed. Please check your reference.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Brand hairline from crest colors */}
        <div className="h-1 w-full flex">
          <div className="flex-1 bg-[#091E3A]" />
          <div className="w-16 bg-[#E6007E]" />
          <div className="w-14 bg-[#FFCC00]" />
          <div className="w-12 bg-[#00883E]" />
        </div>

        <div className="px-6 py-4 bg-[#091E3A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 drop-shadow-xs">
              <UCULogo size={36} />
            </div>
            <div>
              <h3 className="text-base font-serif font-black tracking-tight text-white">Submit Payment for Verification</h3>
              <p className="text-xs text-[#FFD700]">UCU Accounts Office Deposit & Mobile Money Intake</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Payment Method / Bank
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#091E3A]"
            >
              <option value="STANBIC_BANK_DEPOSIT">Stanbic Bank (UCU Collection Account)</option>
              <option value="CENTENARY_BANK_DEPOSIT">Centenary Bank (UCU Collection Account)</option>
              <option value="ABSA_BANK_DEPOSIT">Absa Bank (UCU Fees Account)</option>
              <option value="DFCU_BANK_DEPOSIT">DFCU Bank (UCU Collection)</option>
              <option value="MTN_MOBILE_MONEY">MTN Mobile Money (MoMo Pay)</option>
              <option value="AIRTEL_MONEY">Airtel Money (School Pay)</option>
              <option value="ZEEPAY_ONLINE">ZeePay / Electronic Card</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Transaction Reference / Slip # *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. STB-2026-90412"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#091E3A]"
              />
              <span className="text-[10px] text-slate-500">Must be globally unique</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Amount Paid (UGX) *
              </label>
              <input
                type="number"
                required
                min="1000"
                step="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#091E3A]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Payment Date
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#091E3A]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Deposit Slip / Receipt Image Attachment URL
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://example.com/receipt.jpg"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#091E3A]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Branch deposited, depositor name, or sponsor voucher notes..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#091E3A]"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Statutory Policy:</strong> Payments remain in <em>Pending Verification</em> until approved by an Accounts Officer. Only verified payments count towards the 45% course registration threshold.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#091E3A] hover:bg-[#132E52] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying & Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
