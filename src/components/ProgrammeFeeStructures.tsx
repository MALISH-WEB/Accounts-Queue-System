import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  ShieldCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award
} from 'lucide-react';
import { ProgrammeTuitionStructure } from '../types';
import { UCU_PROGRAMME_FEE_STRUCTURES } from '../data/programme-fee-structures';
import { UCULogo } from './UCULogo';

interface ProgrammeFeeStructuresProps {
  currentStudentProgramme?: string;
  onSelectProgramme?: (prog: ProgrammeTuitionStructure) => void;
}

export const ProgrammeFeeStructures: React.FC<ProgrammeFeeStructuresProps> = ({
  currentStudentProgramme,
  onSelectProgramme: _onSelectProgramme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('ALL');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const faculties = [
    'ALL',
    'Faculty of Science & Technology',
    'Faculty of Law',
    'School of Business',
    'School of Medicine & Dentistry',
    'Bishop Tucker School of Divinity',
    'Faculty of Engineering, Design & Technology',
    'Faculty of Social Sciences',
  ];

  const filteredProgrammes = useMemo(() => {
    return UCU_PROGRAMME_FEE_STRUCTURES.filter((prog) => {
      const matchesFaculty = selectedFaculty === 'ALL' || prog.faculty === selectedFaculty;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        prog.name.toLowerCase().includes(query) ||
        prog.code.toLowerCase().includes(query) ||
        prog.faculty.toLowerCase().includes(query) ||
        prog.campus.toLowerCase().includes(query);
      return matchesFaculty && matchesSearch;
    });
  }, [selectedFaculty, searchQuery]);

  const toggleExpand = (code: string) => {
    setExpandedCode((prev) => (prev === code ? null : code));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner: UCU Royal Blue with Episcopal Magenta, Gold & Green Brand Elements */}
      <div className="bg-gradient-to-r from-[#091E3A] via-[#0047AB] to-[#091E3A] rounded-xl p-6 text-white shadow-md border border-[#1E3A60] relative overflow-hidden">
        {/* Subtle accent bar at top of card */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E6007E] via-[#FFCC00] to-[#00883E]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 flex items-center justify-center shrink-0 drop-shadow-lg transition-transform hover:scale-105">
              <UCULogo size={52} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#E6007E] text-white shadow-xs border border-[#F472B6]/40">
                  Official Fee Gazette 2025/2026
                </span>
                <span className="text-xs text-[#FFD700] font-mono font-semibold">Easter Semester</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#00883E] text-[#DCFCE7] border border-[#86EFAC]/40">
                  UCU Senate Accredited
                </span>
              </div>
              <h2 className="text-xl font-serif font-black text-white mt-1.5">
                Academic Programmes & Tuition Structures
              </h2>
              <p className="text-xs text-slate-200 mt-1 max-w-2xl leading-relaxed">
                Under Uganda Christian University Statutory Financial Regulations, tuition is tailored to each academic discipline. The mandatory <strong className="text-[#FFD700]">45% registration</strong>, <strong className="text-[#FFD700]">75% mid-semester examination</strong>, and <strong className="text-[#86EFAC]">100% final clearance</strong> thresholds derive directly from your programme's assessed structure.
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-lg border border-white/15 text-xs shrink-0 space-y-1">
            <div className="flex items-center gap-2 text-[#E5B53B] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#C69214]" />
              <span>Statutory Rule Derivation</span>
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              • 45% = Assessed Total × 0.45<br />
              • 75% = Assessed Total × 0.75<br />
              • 100% = Assessed Total × 1.00
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by programme name (e.g. Laws, Information Technology, Nursing, BBA)..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white text-[#0F172A] placeholder:text-slate-400 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C69214] shadow-inner"
            />
          </div>

          <div className="sm:col-span-5">
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white text-[#0F172A] font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C69214]"
            >
              {faculties.map((f) => (
                <option key={f} value={f}>
                  {f === 'ALL' ? 'All UCU Faculties & Schools' : f}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Programme Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredProgrammes.map((prog) => {
          const isEnrolled =
            currentStudentProgramme &&
            (currentStudentProgramme.toLowerCase().includes(prog.code.toLowerCase()) ||
              prog.name.toLowerCase().includes(currentStudentProgramme.toLowerCase()));

          const isExpanded = expandedCode === prog.code;

          return (
            <div
              key={prog.id}
              className={`bg-white rounded-xl border transition-all duration-200 shadow-xs hover:shadow-md ${
                isEnrolled
                  ? 'border-[#C69214] ring-2 ring-[#C69214]/25'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#091E3A] text-[#E5B53B] border border-[#1E3A60]">
                        {prog.code}
                      </span>
                      <span className="text-[11px] font-medium text-[#475569]">
                        {prog.campus}
                      </span>
                      {isEnrolled && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                          Your Enrolled Programme
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A] mt-1.5 leading-snug">
                      {prog.name}
                    </h3>
                    <p className="text-xs text-[#334155] mt-0.5 font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#C69214]" />
                      {prog.faculty}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      Total Semester Assessment
                    </span>
                    <div className="flex items-baseline justify-end gap-1 mt-0.5">
                      <span className="text-xs font-bold text-[#64748B]">UGX</span>
                      <span className="text-xl font-extrabold text-[#091E3A]">
                        {prog.totalAssessed.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#334155] mt-3 leading-relaxed">
                  {prog.description}
                </p>
              </div>

              {/* Assessment Breakdown (Tuition vs Functional Fees) */}
              <div className="p-5 bg-slate-50/70 grid grid-cols-2 gap-3 border-b border-slate-100 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] block">
                    Core Tuition
                  </span>
                  <div className="text-sm font-bold text-[#0F172A] mt-0.5">
                    UGX {prog.tuitionFee.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-[#64748B]">Instruction & academic faculty</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] block">
                    Functional Fees
                  </span>
                  <div className="text-sm font-bold text-[#0F172A] mt-0.5">
                    UGX {prog.functionalFees.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-[#64748B]">Exams, ICT, Clinic, Guild & Labs</span>
                </div>
              </div>

              {/* Statutory Policy Milestones derived specifically for this programme */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#091E3A]" />
                    Programme Statutory Policy Milestones
                  </span>
                  <button
                    onClick={() => toggleExpand(prog.code)}
                    className="text-xs text-[#091E3A] hover:text-[#C69214] font-semibold flex items-center gap-1 transition-colors"
                  >
                    {isExpanded ? 'Hide Functional Breakdown' : 'View Itemized Fees'}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* 3 Milestone Blocks with UCU Brand Colors */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {/* 45% Milestone: UCU Deep Blue */}
                  <div className="p-2.5 rounded-lg bg-[#091E3A]/5 border border-[#091E3A]/20">
                    <span className="text-[10px] font-bold uppercase text-[#091E3A] block">
                      45% Registration
                    </span>
                    <div className="font-extrabold text-[#091E3A] text-xs mt-1 font-mono">
                      UGX {prog.policyRegistration45.toLocaleString()}
                    </div>
                    <span className="text-[9px] text-[#475569] block mt-0.5 font-medium">Due Week 4</span>
                  </div>

                  {/* 75% Milestone: UCU Gold */}
                  <div className="p-2.5 rounded-lg bg-[#FEF9C3]/80 border border-[#FDE047]">
                    <span className="text-[10px] font-bold uppercase text-[#854D0E] block">
                      75% Mid-Sem Exam
                    </span>
                    <div className="font-extrabold text-[#854D0E] text-xs mt-1 font-mono">
                      UGX {prog.policyMidSem75.toLocaleString()}
                    </div>
                    <span className="text-[9px] text-[#92400E] block mt-0.5 font-medium">Exam Card Permit</span>
                  </div>

                  {/* 100% Milestone: UCU Green (Growth & Life) */}
                  <div className="p-2.5 rounded-lg bg-[#DCFCE7]/80 border border-[#86EFAC]">
                    <span className="text-[10px] font-bold uppercase text-[#14532D] block">
                      100% Full Clearance
                    </span>
                    <div className="font-extrabold text-[#14532D] text-xs mt-1 font-mono">
                      UGX {prog.policyFinal100.toLocaleString()}
                    </div>
                    <span className="text-[9px] text-[#15803D] block mt-0.5 font-medium">Final Exams</span>
                  </div>
                </div>

                {/* Expanded Itemized Breakdown in Charcoal & Deep Blue */}
                {isExpanded && (
                  <div className="mt-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 animate-in fade-in duration-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#334155] block mb-1">
                      Itemized Functional Fees Schedule ({prog.code})
                    </span>
                    <div className="flex justify-between text-[#1E293B]">
                      <span>Examination & Assessment Fee:</span>
                      <span className="font-semibold text-[#0F172A]">UGX {prog.functionalFeesBreakdown.examinationFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#1E293B]">
                      <span>Technology & ICT E-Learning Fee:</span>
                      <span className="font-semibold text-[#0F172A]">UGX {prog.functionalFeesBreakdown.technologyIctFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#1E293B]">
                      <span>Library & Information Resource Fee:</span>
                      <span className="font-semibold text-[#0F172A]">UGX {prog.functionalFeesBreakdown.libraryFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#1E293B]">
                      <span>Medical & Clinic Health Coverage:</span>
                      <span className="font-semibold text-[#0F172A]">UGX {prog.functionalFeesBreakdown.medicalClinicFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#1E293B]">
                      <span>Guild & Sports Association Fee:</span>
                      <span className="font-semibold text-[#0F172A]">UGX {prog.functionalFeesBreakdown.guildSportsFee.toLocaleString()}</span>
                    </div>
                    {prog.functionalFeesBreakdown.clinicalLabFee && (
                      <div className="flex justify-between text-[#1E293B]">
                        <span>Clinical / Media / Workshop Practicum:</span>
                        <span className="font-semibold text-[#0F172A]">UGX {prog.functionalFeesBreakdown.clinicalLabFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-[#091E3A] font-bold">
                      <span>Default Late Payment Surcharge:</span>
                      <span>UGX {prog.latePaymentCharge.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
