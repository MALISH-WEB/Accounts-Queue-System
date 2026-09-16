import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Printer,
  RefreshCw,
  Send,
  ShieldCheck,
  Users,
  ChevronRight,
  BookOpen,
  QrCode,
  CheckSquare,
  Square,
  Sparkles,
  Building2,
  FileText
} from 'lucide-react';
import { apiRequest, UserSession } from '../lib/api';
import { UCULogo } from './UCULogo';

interface AcademicsRegistrationPageProps {
  session: UserSession;
  onOpenMakePayment?: () => void;
  onOpenLiveTv?: () => void;
}

interface CourseUnitItem {
  code: string;
  title: string;
  creditUnits: number;
  type: 'CORE' | 'ELECTIVE' | 'FOUNDATIONAL';
  description?: string;
}

export const AcademicsRegistrationPage: React.FC<AcademicsRegistrationPageProps> = ({
  session,
  onOpenMakePayment,
  onOpenLiveTv,
}) => {
  const student = session.user.student;
  const studentId = student?.id || 'STU_1';
  const isStaff = session.user.role === 'ACCOUNTS_OFFICER' || session.user.role === 'SENIOR_ACCOUNTS_OFFICER' || session.user.role === 'ACCOUNTS_SUPERVISOR';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stamping, setStamping] = useState(false);
  const [registrationData, setRegistrationData] = useState<any | null>(null);
  const [activeQueueEntry, setActiveQueueEntry] = useState<any | null>(null);
  const [eligibility, setEligibility] = useState<any | null>(null);
  const [curriculumCourses, setCurriculumCourses] = useState<CourseUnitItem[]>([]);
  const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
  const [specialNotes, setSpecialNotes] = useState('');
  const [autoJoinQueue, setAutoJoinQueue] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load registration, queue status, and curriculum
  const loadRegistrationState = async () => {
    try {
      setErrorMsg(null);
      const res = await apiRequest<any>(`/registrations/my-registration?studentId=${studentId}&semesterId=SEM_EASTER_2026`);
      setRegistrationData(res.registration);
      setActiveQueueEntry(res.activeQueueEntry);
      setEligibility(res.eligibility);

      // Load curriculum courses
      const curr = await apiRequest<any>(`/registrations/curriculum?programme=${encodeURIComponent(student?.programme || 'Bachelor of Science in Information Technology')}`);
      if (curr?.courses && Array.isArray(curr.courses)) {
        setCurriculumCourses(curr.courses);
        // Pre-select all by default if no registration yet
        if (!res.registration) {
          setSelectedCourseCodes(curr.courses.map((c: any) => c.code));
        }
      }
    } catch (err: any) {
      console.error('Error loading registration state:', err);
      setErrorMsg(err.message || 'Failed to load registration information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrationState();
    // Poll queue status every 6 seconds if pending stamp
    const interval = setInterval(() => {
      loadRegistrationState();
    }, 6000);
    return () => clearInterval(interval);
  }, [studentId]);

  const toggleCourseSelection = (code: string) => {
    setSelectedCourseCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectAll = () => {
    setSelectedCourseCodes(curriculumCourses.map((c) => c.code));
  };

  const handleDeselectAll = () => {
    // Keep foundational/core if desired, or empty
    setSelectedCourseCodes([]);
  };

  // Submit registration request & join queue
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourseCodes.length === 0) {
      alert('Please select at least one course unit to register.');
      return;
    }

    const coursesToSubmit = curriculumCourses.filter((c) => selectedCourseCodes.includes(c.code));

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await apiRequest<any>('/registrations/submit', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          semesterId: 'SEM_EASTER_2026',
          courseUnits: coursesToSubmit,
          specialNotes,
          autoJoinQueue,
        }),
      });

      setRegistrationData(res.registration);
      setActiveQueueEntry(res.queueEntry);
      setSuccessMsg(res.message || 'Registration request submitted successfully and queued for Academics Office stamping!');
      await loadRegistrationState();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit course registration request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Explicitly join stamp queue if not in queue
  const handleJoinStampQueue = async () => {
    if (!registrationData?.id) return;
    setSubmitting(true);
    try {
      const res = await apiRequest<any>(`/registrations/${registrationData.id}/join-stamp-queue`, {
        method: 'POST',
      });
      setActiveQueueEntry(res.queueEntry);
      setSuccessMsg('Successfully joined the Academics Office Stamping Queue.');
      await loadRegistrationState();
    } catch (err: any) {
      alert(err.message || 'Failed to join Academics Office queue.');
    } finally {
      setSubmitting(false);
    }
  };

  // Endorse & Affix Academic Stamp (Staff action, or demo testing override)
  const handleStampRegistration = async () => {
    if (!registrationData?.id) return;
    if (!confirm('Affix official Uganda Christian University Academic Registrar stamp and endorse semester course registration?')) {
      return;
    }

    setStamping(true);
    try {
      const res = await apiRequest<any>(`/registrations/${registrationData.id}/stamp`, {
        method: 'POST',
        body: JSON.stringify({
          staffId: session.user.id || 'USR_STAFF_1',
          staffName: session.user.fullName || 'Mr. David Mukasa (Academic Registrar Desk)',
        }),
      });
      setRegistrationData(res.registration);
      setSuccessMsg('Official university stamp successfully affixed! Student is now registered for the semester.');
      await loadRegistrationState();
    } catch (err: any) {
      alert(err.message || 'Failed to stamp registration.');
    } finally {
      setStamping(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const clearancePercent = eligibility?.metrics?.percentagePaid ?? 60.0;
  const isCleared45 = clearancePercent >= 45.0;
  const isStamped = registrationData?.status === 'STAMPED';
  const isPendingStamp = registrationData && registrationData.status === 'PENDING_ACADEMIC_STAMP';

  const selectedCreditsTotal = curriculumCourses
    .filter((c) => selectedCourseCodes.includes(c.code))
    .reduce((acc, c) => acc + c.creditUnits, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="animate-spin w-8 h-8 border-3 border-[#091E3A] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#091E3A]">Loading Academic Registration Records...</p>
        <p className="text-xs text-slate-500">Checking UCU Academic Registrar system & queue status</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#091E3A] via-[#102A4C] to-[#0A2244] text-white p-6 rounded-2xl shadow-sm border border-[#1E3A60] relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-10 flex items-center justify-center pointer-events-none">
          <UCULogo size="lg" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E5B53B] text-[#091E3A]">
                Academics Office
              </span>
              <span className="text-[11px] font-semibold text-slate-300">
                Easter Semester 2026 • Academic Year 2025/2026
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Self-Service & Physical Queue
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-[#E5B53B]" />
              Course Registration & Academic Stamp Queue
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Submit your semester course unit registration request online, verify your 45% Accounts clearance,
              and join the virtual queue in the Academics Office for your official verification card stamp.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            {isStamped && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-white/20"
              >
                <Printer className="w-4 h-4 text-[#E5B53B]" />
                Print Stamped Slip
              </button>
            )}

            <button
              onClick={loadRegistrationState}
              className="px-3 py-2 bg-[#1E3A60] hover:bg-[#2A4D7E] text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Refresh status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Financial Prerequisite Verification Bar */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${
        isCleared45
          ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border-emerald-200'
          : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isCleared45 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
          }`}>
            {isCleared45 ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Statutory Accounts Clearance:
              </span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                isCleared45 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {clearancePercent.toFixed(1)}% Verified Paid
              </span>
              <span className="text-[11px] font-bold text-slate-500">(Required: 45.0%)</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isCleared45
                ? 'Your tuition payments satisfy the statutory 45% threshold. The Academics Office will endorse and stamp your registration card without financial hold.'
                : 'Tuition verified is currently below the 45% statutory threshold. You can draft your request, but the official stamp requires Accounts clearance.'}
            </p>
          </div>
        </div>

        {!isCleared45 && onOpenMakePayment && (
          <button
            onClick={onOpenMakePayment}
            className="px-3.5 py-1.5 bg-[#091E3A] hover:bg-[#102A4C] text-[#E5B53B] font-bold text-xs rounded-lg transition-colors shrink-0 shadow-2xs"
          >
            Pay Tuition Top-up &rarr;
          </button>
        )}
      </div>

      {/* 3. ACTIVE QUEUE TICKET BANNER (If waiting in queue for stamp) */}
      {isPendingStamp && activeQueueEntry && (
        <div className="bg-gradient-to-r from-[#091E3A] via-[#102A4C] to-[#0A2244] text-white p-6 rounded-2xl border-2 border-[#E5B53B] shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#E5B53B] text-[#091E3A]">
                  <Clock className="w-3 h-3" /> Live Academics Queue Pass
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  Ticket #{activeQueueEntry.queue_number}
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white flex items-center gap-3">
                  {activeQueueEntry.queue_number}
                  <span className="text-sm font-sans font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Position: #{activeQueueEntry.position || 1} in queue
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Service Desk: <span className="text-[#E5B53B] font-bold">Counter 5 — Academics Office: Registration & Stamping Desk</span>
                </p>
              </div>

              <div className="text-xs text-slate-300 flex items-center gap-4 pt-1">
                <span>Estimated Wait: <strong className="text-white">~{activeQueueEntry.estimated_wait_minutes || 5} minutes</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-amber-300 uppercase">{activeQueueEntry.status}</strong></span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {onOpenLiveTv && (
                <button
                  onClick={onOpenLiveTv}
                  className="px-4 py-2.5 bg-[#1E3A60] hover:bg-[#2A4D7E] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-[#2A4D7E]"
                >
                  <Users className="w-4 h-4 text-[#E5B53B]" />
                  View Public Hall TV
                </button>
              )}

              {/* Staff / Testing Action: Affix Stamp Now */}
              <button
                onClick={handleStampRegistration}
                disabled={stamping}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Award className="w-4 h-4 text-white" />
                {stamping ? 'Stamping...' : 'Officer: Affix Official Stamp & Endorse'}
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>
              Your registration request has been transmitted. Please present yourself at Counter 5 or keep this tab open.
              The Academic Registrar will verify your request and stamp your official course registration card.
            </span>
          </div>
        </div>
      )}

      {/* 4. MAIN VIEW: Stamped Certificate vs. Course Selection Form */}
      {isStamped ? (
        /* ============================================================ */
        /* VIEW A: OFFICIALLY STAMPED & REGISTERED CERTIFICATE          */
        /* ============================================================ */
        <div className="bg-white rounded-2xl border-2 border-emerald-500/50 shadow-sm overflow-hidden">
          {/* Top Stamped Notification Bar */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-white" />
              Officially Registered & Stamped by Academic Registrar
            </div>
            <span className="text-xs font-mono bg-emerald-800/60 px-2.5 py-0.5 rounded text-emerald-100 font-bold">
              Seal Ref: {registrationData.stamp_seal_number || 'UCU-AR-EASTER2026-0491'}
            </span>
          </div>

          {/* Stamped Document Body (Printable) */}
          <div className="p-6 sm:p-8 space-y-6 print:p-0">
            {/* University Letterhead */}
            <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <UCULogo size="lg" />
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#091E3A] tracking-tight uppercase">
                    Uganda Christian University
                  </h2>
                  <p className="text-xs font-bold text-[#E5B53B] uppercase tracking-wider">
                    Office of the Academic Registrar • Mukono Main Campus
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Official Semester Course Unit Registration Card & Endorsement
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Registration Slip ID
                </span>
                <span className="text-sm font-black font-mono text-[#091E3A]">
                  {registrationData.registration_code}
                </span>
                <span className="text-[11px] text-slate-500 block font-medium">
                  Academic Year: 2025/2026 (Easter Semester)
                </span>
              </div>
            </div>

            {/* Student Bio Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Name</span>
                <span className="font-bold text-[#091E3A] text-sm">{registrationData.student_name || student?.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Number</span>
                <span className="font-bold font-mono text-slate-800">{registrationData.student_number || student?.studentNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration Number</span>
                <span className="font-bold font-mono text-slate-800">{registrationData.registration_number || student?.registrationNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Degree Programme</span>
                <span className="font-bold text-slate-800">{registrationData.programme || student?.programme}</span>
              </div>
            </div>

            {/* Course Units Enrolled Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#091E3A] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#091E3A]" />
                  Endorsed Course Units ({registrationData.course_units?.length || 0} Modules)
                </h3>
                <span className="text-xs font-bold text-slate-600">
                  Total Enrolled: <strong className="text-[#091E3A]">{registrationData.total_credit_units || 21} Credit Units (CU)</strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#091E3A] text-white uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">Course Code</th>
                      <th className="py-2.5 px-4">Course Unit Title</th>
                      <th className="py-2.5 px-4 text-center">Type</th>
                      <th className="py-2.5 px-4 text-center">Credit Units</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(registrationData.course_units || []).map((c: any, idx: number) => (
                      <tr key={c.code || idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold font-mono text-[#091E3A]">{c.code}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{c.title}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.type === 'FOUNDATIONAL'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {c.type || 'CORE'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold font-mono text-slate-700">
                          {c.creditUnits} CU
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> Endorsed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* THE OFFICIAL UCU CIRCULAR STAMP & SIGN-OFF SECTION */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Financial & Audit Standing */}
              <div className="md:col-span-6 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Accounts Standing:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                    {registrationData.financial_clearance_percent || 60}% Paid — Verified Cleared
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Endorsing Officer:</span>
                  <span className="text-slate-800 font-medium">
                    {registrationData.stamped_by_name || 'Mr. David Mukasa (Academic Registrar Desk)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Date & Timestamp:</span>
                  <span className="font-mono text-slate-700">
                    {registrationData.stamped_at
                      ? new Date(registrationData.stamped_at).toLocaleString()
                      : new Date().toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 italic pt-1">
                  This official document confirms semester course unit registration. It satisfies lecture and tutorial admission requirements.
                </p>
              </div>

              {/* AUTHORITATIVE CIRCULAR UNIVERSITY STAMP (Embossed & Sealed) */}
              <div className="md:col-span-6 flex items-center justify-center md:justify-end gap-6">
                {/* QR Code Validation Badge */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-white border-2 border-slate-300 rounded-lg p-1.5 flex flex-col items-center justify-center shadow-xs">
                    <QrCode className="w-12 h-12 text-[#091E3A]" />
                    <span className="text-[8px] font-mono uppercase text-slate-500 mt-0.5">SCAN TO VERIFY</span>
                  </div>
                </div>

                {/* THE OFFICIAL CIRCULAR EMBOSSED UCU STAMP */}
                <div className="relative group cursor-pointer" title="Official Academic Registrar Stamp">
                  <div className="w-36 h-36 rounded-full border-4 border-dashed border-[#BE0061] p-1 flex items-center justify-center shadow-xs bg-[#FDF2F8]/70 rotate-[-8deg] hover:rotate-0 transition-transform">
                    <div className="w-full h-full rounded-full border-2 border-solid border-[#BE0061] flex flex-col items-center justify-center text-center p-2">
                      <span className="text-[8px] font-black uppercase tracking-wider text-[#BE0061] leading-tight">
                        ★ UGANDA CHRISTIAN UNIV ★
                      </span>
                      <span className="text-[7px] font-extrabold uppercase text-slate-600 mt-0.5">
                        ACADEMIC REGISTRAR
                      </span>
                      
                      {/* Center Stamp Emblem */}
                      <div className="my-0.5 py-0.5 px-1.5 bg-[#BE0061] text-white text-[9px] font-black uppercase tracking-widest rounded-sm">
                        OFFICIALLY STAMPED
                      </div>
                      
                      <span className="text-[8px] font-mono font-bold text-[#BE0061]">
                        EASTER SEMESTER 2026
                      </span>
                      <span className="text-[7px] font-mono text-slate-500">
                        {registrationData.stamp_seal_number || 'UCU-AR-EASTER2026'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Endorsed under UCU Academic Registrar Regulations (Rule 14-B).</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#091E3A] hover:bg-[#102A4C] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-[#E5B53B]" /> Print Official Card
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* VIEW B: COURSE REGISTRATION FORM & QUEUE REQUEST             */
        /* ============================================================ */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Section 1: Student Information Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1 of 3</span>
                <h3 className="text-base font-extrabold text-[#091E3A] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#091E3A]" />
                  Student Bio & Academic Enrollment Confirmation
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-[#091E3A] border border-blue-100">
                Easter Semester 2026
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Name</span>
                <span className="font-bold text-[#091E3A]">{student?.name || 'Jane Namukasa'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Access Number / Reg</span>
                <span className="font-bold font-mono text-slate-800">{student?.studentNumber || 'S23B13/042'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled Programme</span>
                <span className="font-bold text-slate-800">{student?.programme || 'Bachelor of Science in Information Technology'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Faculty / Campus</span>
                <span className="font-bold text-slate-800">{student?.faculty || 'Science & Technology'} • Mukono</span>
              </div>
            </div>
          </div>

          {/* Section 2: Course Units Selection Checklist */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2 of 3</span>
                <h3 className="text-base font-extrabold text-[#091E3A] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#091E3A]" />
                  Select Course Units for Registration
                </h3>
                <p className="text-xs text-slate-500">
                  Select the semester course units you wish to enroll. Core courses are automatically pre-selected according to faculty curriculum.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 text-xs font-semibold text-[#091E3A] hover:bg-slate-100 rounded-md transition-colors"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Course Cards Grid */}
            <div className="space-y-3">
              {curriculumCourses.map((c) => {
                const isSelected = selectedCourseCodes.includes(c.code);
                return (
                  <div
                    key={c.code}
                    onClick={() => toggleCourseSelection(c.code)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-blue-50/40 border-blue-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#091E3A]" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#091E3A] bg-white px-2 py-0.5 rounded border border-slate-200">
                          {c.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.type === 'FOUNDATIONAL'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.type}
                        </span>
                      </div>
                      {c.description && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {c.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-[#091E3A] font-mono">
                        {c.creditUnits} CU
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Credits Tally */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">
                Selected Course Units: <strong className="text-[#091E3A]">{selectedCourseCodes.length} modules</strong>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Cumulative Load:</span>
                <span className="text-sm font-black font-mono text-[#091E3A] px-2.5 py-0.5 rounded bg-blue-100 text-blue-900">
                  {selectedCreditsTotal} Credit Units
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Submission & Academics Office Queue Dispatch */}
          <form onSubmit={handleSubmitRegistration} className="space-y-4 pt-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 3 of 3</span>
              <h3 className="text-base font-extrabold text-[#091E3A] flex items-center gap-2">
                <Send className="w-4 h-4 text-[#091E3A]" />
                Submit Request & Dispatch to Academics Office Queue
              </h3>
            </div>

            {/* Special Notes / Comments */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Special Remarks or Elective Requests (Optional)
              </label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="e.g. Regular day session; requesting enrollment endorsement for final semester credit units..."
                rows={2}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#091E3A] bg-white text-slate-800"
              />
            </div>

            {/* Auto-join Queue Option */}
            <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 flex items-start gap-3">
              <input
                type="checkbox"
                id="autoQueueCheckbox"
                checked={autoJoinQueue}
                onChange={(e) => setAutoJoinQueue(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#091E3A] focus:ring-[#091E3A]"
              />
              <label htmlFor="autoQueueCheckbox" className="text-xs text-slate-700 cursor-pointer">
                <strong className="text-[#091E3A] font-bold block mb-0.5">
                  Immediately join the virtual queue in the Academics Office for official stamping
                </strong>
                Upon dispatching your registration request, the system will automatically allocate you a virtual ticket
                at <strong className="text-[#091E3A]">Counter 5 — Academics Office: Registration & Stamping Desk</strong>,
                saving your spot without waiting in physical lines.
              </label>
            </div>

            {/* Submit Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-500">
                {isCleared45 ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 45% Accounts clearance verified for stamping.
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> 45% clearance needed before stamp approval.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || selectedCourseCodes.length === 0}
                className="px-6 py-3 bg-[#091E3A] hover:bg-[#102A4C] text-[#E5B53B] font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-[#E5B53B] border-t-transparent rounded-full" />
                    Dispatching Registration & Joining Queue...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#E5B53B]" />
                    Send Registration Request & Join Stamp Queue &rarr;
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
