import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  AlertCircle,
  ShieldCheck,
  FileText,
  DollarSign,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: 'CLEARANCE' | 'LATE_FEES' | 'REFUNDS' | 'PAYMENTS';
  categoryLabel: string;
  question: string;
  answer: string;
  highlights?: string[];
  actionHint?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'CLEARANCE',
    categoryLabel: 'Registration & Clearance',
    question: 'Why do I need 45% tuition payment for course registration?',
    answer:
      'In accordance with UCU Financial Policy, students must pay at least 45% of total assessed tuition and functional fees by Week 4 of the semester to gain access to course registration and lecture attendance lists. Until this 45% threshold is strictly met, course enrollment on the Alpha student portal remains blocked.',
    highlights: [
      'Strict 45% threshold required by Week 4',
      'Calculated automatically from verified ledger payments',
      'Unverified bank deposit slips do not count toward the 45%'
    ],
    actionHint: 'View your real-time percentage under the Financial Clearance tab.'
  },
  {
    id: 'faq-2',
    category: 'CLEARANCE',
    categoryLabel: 'Registration & Clearance',
    question: 'When is the 75% mid-semester examination clearance deadline?',
    answer:
      'Students must attain a cumulative 75% fee payment by Week 8 of the semester. This milestone generates your official Mid-Semester Examination Clearance Card. Failure to reach 75% prevents entrance into mid-semester exam rooms and marks coursework as unsubmitted.',
    highlights: [
      '75% cumulative payment required by Week 8',
      'Required for mid-semester examination cards',
      '100% required prior to final exam week'
    ]
  },
  {
    id: 'faq-3',
    category: 'LATE_FEES',
    categoryLabel: 'Late Fees & Holds',
    question: 'How and when is the UGX 50,000 late payment surcharge applied?',
    answer:
      'A statutory late payment surcharge of UGX 50,000 is automatically assessed to student ledgers if the mandatory 45% threshold is not reached by the semester registration deadline. The system applies this surcharge upon passing the deadline timestamp unless a formal financial deferral has been approved by the Directorate of Finance.',
    highlights: [
      'Flat UGX 50,000 charge on defaulting ledgers',
      'Assessed automatically after the Week 4 cutoff',
      'Can only be waived upon verified administrative error or approved appeal'
    ],
    actionHint: 'To appeal a late charge, select "Late Fee Appeal" in the services catalog above.'
  },
  {
    id: 'faq-4',
    category: 'LATE_FEES',
    categoryLabel: 'Late Fees & Holds',
    question: 'What does an Accounts Financial Hold (H-01 / H-02) mean on my portal?',
    answer:
      'A financial hold is placed when there are unsettled prior-semester balances, unverified bank payments, or disciplinary financial obligations. While active, holds prevent transcript printing, semester registration, and graduation clearance. Resolving the outstanding balance automatically lifts the hold within 15 minutes.',
    highlights: [
      'Blocks graduation, transcript printing, and registration',
      'Auto-lifts upon ledger reconciliation and zero balance',
      'Requires clearance token from the Cash Office if manual waiver was issued'
    ]
  },
  {
    id: 'faq-5',
    category: 'REFUNDS',
    categoryLabel: 'Refunds & Overpayments',
    question: 'What is UCU’s refund policy if I overpay or withdraw from a semester?',
    answer:
      'Any overpayment above 100% of assessed semester fees automatically carries forward as a credit balance toward your next academic semester. Cash refunds to bank accounts are strictly permitted only for graduating students or students who have formally withdrawn with Senate approval. Approved refunds are processed within 14 working days via bank EFT.',
    highlights: [
      'Overpayments automatically roll over to future semesters',
      'Cash refunds require Dean of Students and Senate withdrawal approval',
      'Official bank details and copy of national ID required for EFT disbursement'
    ],
    actionHint: 'Submit a "Refund / Excess Fees Request" via the services catalog.'
  },
  {
    id: 'faq-6',
    category: 'REFUNDS',
    categoryLabel: 'Refunds & Overpayments',
    question: 'Can tuition paid for one student be transferred to a sibling or relative?',
    answer:
      'Inter-student tuition transfers are permitted between verified siblings enrolled at UCU. Both students must provide birth certificates or parental affidavits to the Accounts Office, and a joint consent form signed by the sponsor must accompany the digital service request.',
    highlights: [
      'Supported between verified siblings only',
      'Sponsor letter and birth certificates required',
      'Requires Chief Financial Officer sign-off'
    ]
  },
  {
    id: 'faq-7',
    category: 'PAYMENTS',
    categoryLabel: 'Bank Payments & Slips',
    question: 'How long does it take for a Stanbic or Centenary bank deposit to reflect?',
    answer:
      'Payments made via integrated UCU collection accounts (Stanbic Bank, Centenary Bank, DFCU, Absa, and MTN/Airtel MoMo Pay with UCU Student PRN) generally reflect within 1 to 2 hours during banking business days. If paid over the counter with a physical bank slip, please upload the slip in the Payments tab for manual staff reconciliation within 24 hours.',
    highlights: [
      'Direct PRN payments: 1-2 hours automatic reconciliation',
      'Physical bank deposit slips: up to 24 hours verification',
      'Always quote your Student Number and PRN accurately on the slip'
    ],
    actionHint: 'Upload your proof of payment under the "Payments & Receipts" tab.'
  },
  {
    id: 'faq-8',
    category: 'PAYMENTS',
    categoryLabel: 'Bank Payments & Slips',
    question: 'Can I pay fees using an Installment Agreement or Promissory Note?',
    answer:
      'Students experiencing verifiable financial distress may apply for a formal Installment Agreement before the 45% deadline. An agreement requires a minimum initial deposit of 30%, a formal commitment signed by a parent/guardian, and approval from the Accounts Supervisor.',
    highlights: [
      'Minimum 30% initial deposit required',
      'Requires signed sponsor guarantee',
      'Must be initiated at least 5 working days before registration closes'
    ]
  }
];

interface FAQSectionProps {
  onSelectServiceQuery?: (serviceQuery: string) => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onSelectServiceQuery }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('faq-1');

  const categories = [
    { key: 'ALL', label: 'All Topics' },
    { key: 'CLEARANCE', label: 'Milestones & Clearance' },
    { key: 'LATE_FEES', label: 'Late Fees & Holds' },
    { key: 'REFUNDS', label: 'Refunds & Overpayments' },
    { key: 'PAYMENTS', label: 'Bank Deposits & Verification' },
  ];

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.highlights?.some((h) => h.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#091E3A] to-[#102A4C] p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C69214]/20 border border-[#C69214]/40 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Financial Clearance & Accounts Knowledge Base
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Instant answers to common statutory fee policies, late charges, milestones, and refunds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#D4AF37] bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>UCU Policy 2026</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions on late fees, 45% milestone, exam cards, refund policies..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C69214] shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-0.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-[#C69214] text-[#091E3A] font-bold shadow-xs'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="p-5 divide-y divide-slate-100">
        {filteredFaqs.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700 mt-2">No matching questions found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              We couldn't find an answer matching "{searchQuery}". You can submit a direct digital inquiry to the Accounts Office above.
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div key={faq.id} className="py-3 first:pt-0 last:pb-0">
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full flex items-start justify-between gap-4 text-left group transition-colors py-1"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                        faq.category === 'CLEARANCE'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : faq.category === 'LATE_FEES'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : faq.category === 'REFUNDS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {faq.categoryLabel}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-[#091E3A] leading-snug">
                      {faq.question}
                    </span>
                  </div>

                  <div className="shrink-0 text-slate-400 group-hover:text-slate-600 mt-0.5">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-2.5 pl-0 sm:pl-4 pr-1 text-xs text-slate-600 leading-relaxed space-y-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-100">
                    <p>{faq.answer}</p>

                    {faq.highlights && faq.highlights.length > 0 && (
                      <div className="bg-white p-3 rounded-md border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Key Takeaways & Regulatory Facts
                        </span>
                        <ul className="space-y-1">
                          {faq.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-700">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {faq.actionHint && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-[#091E3A] font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#C69214]" />
                          {faq.actionHint}
                        </span>
                        {onSelectServiceQuery && (
                          <button
                            onClick={() => onSelectServiceQuery(faq.question)}
                            className="text-[#091E3A] font-bold hover:underline flex items-center gap-1 shrink-0"
                          >
                            Ask About This <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Support Banner */}
      <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <FileText className="w-4 h-4 text-[#091E3A]" />
          <span>Need specialized assistance or formal waiver review?</span>
        </div>
        <span className="text-slate-500 font-medium">
          Select a service above to submit a ticket with your student ID attached.
        </span>
      </div>
    </div>
  );
};
