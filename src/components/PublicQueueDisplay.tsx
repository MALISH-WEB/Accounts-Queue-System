import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Clock,
  Users,
  ChevronRight,
  Sparkles,
  Building2,
  GraduationCap,
  Award,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { UCULogo } from './UCULogo';

export type DisplayHall = 'ALL' | 'ACADEMICS' | 'ACCOUNTS';

interface PublicQueueDisplayProps {
  onClose: () => void;
  initialHall?: DisplayHall;
}

export const PublicQueueDisplay: React.FC<PublicQueueDisplayProps> = ({
  onClose,
  initialHall = 'ALL',
}) => {
  const [selectedHall, setSelectedHall] = useState<DisplayHall>(initialHall);
  const [queueData, setQueueData] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const lastAnnouncedTicketRef = useRef<string | null>(null);

  const loadData = async () => {
    try {
      const [qData, regData] = await Promise.all([
        apiRequest<any[]>('/queues').catch(() => []),
        apiRequest<any[]>('/registrations').catch(() => []),
      ]);
      setQueueData(Array.isArray(qData) ? qData : []);
      setRegistrations(Array.isArray(regData) ? regData : []);
    } catch (err) {
      console.error('Failed to load live queue data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const qInterval = setInterval(loadData, 3000);
    const tInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(qInterval);
      clearInterval(tInterval);
    };
  }, []);

  const safeQueue = Array.isArray(queueData) ? queueData : [];

  // Speech announcement when a ticket is called or serving
  const announceCall = (ticketNum: string, counterName: string) => {
    if (!soundEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = `Ticket number ${ticketNum.replace(/-/g, ' ')}, please proceed to ${counterName}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio speech synthesis fallback
    }
  };

  // Full university counters (Counters 1-4: Finance, Counter 5: Academics)
  const ALL_COUNTERS = [
    { id: 1, name: 'Counter 1', role: 'Cashier & Payment Verification', assigned: 'Sarah Tumusiime', hall: 'ACCOUNTS' as const },
    { id: 2, name: 'Counter 2', role: 'Bank Reconciliation & Receipting', assigned: 'Patrick Mukasa', hall: 'ACCOUNTS' as const },
    { id: 3, name: 'Counter 3', role: 'Exam Clearance & Cards', assigned: 'Desk Officer', hall: 'ACCOUNTS' as const },
    { id: 4, name: 'Counter 4', role: 'Financial Holds & Hardship Appeals', assigned: 'Dr. Florence K.', hall: 'ACCOUNTS' as const },
    { id: 5, name: 'Counter 5', role: 'Academics Office: Registration & Stamping Desk', assigned: 'Mr. David Mukasa (AR)', hall: 'ACADEMICS' as const },
  ];

  // Filter counters based on selected display hall
  const displayCounters = ALL_COUNTERS.filter((c) => {
    if (selectedHall === 'ALL') return true;
    return c.hall === selectedHall;
  });

  // Filter queue entries based on selected display hall
  const hallQueue = safeQueue.filter((q) => {
    const isCounter5 = q.assigned_counter?.includes('Counter 5') || q.service_name?.toLowerCase().includes('academic') || q.service_name?.toLowerCase().includes('stamp');
    if (selectedHall === 'ACADEMICS') return isCounter5;
    if (selectedHall === 'ACCOUNTS') return !isCounter5;
    return true;
  });

  // Identify currently called or serving ticket
  const nowCalled = hallQueue.find((q) => q.status === 'CALLED' || q.status === 'SERVING') ||
    (selectedHall === 'ALL' ? safeQueue.find((q) => q.status === 'CALLED' || q.status === 'SERVING') : null);

  const waitingList = hallQueue.filter((q) => q.status === 'WAITING').slice(0, 6);

  // Announce if new call occurs
  useEffect(() => {
    if (nowCalled && nowCalled.queue_number && nowCalled.queue_number !== lastAnnouncedTicketRef.current) {
      lastAnnouncedTicketRef.current = nowCalled.queue_number;
      announceCall(nowCalled.queue_number, nowCalled.assigned_counter || 'Counter 5');
    }
  }, [nowCalled?.queue_number, nowCalled?.assigned_counter]);

  // Academics Office specific metrics
  const stampedCount = registrations.filter((r) => r.status === 'STAMPED').length;
  const pendingStampCount = registrations.filter((r) => r.status === 'PENDING_ACADEMIC_STAMP').length;
  const recentStamped = registrations.filter((r) => r.status === 'STAMPED').slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-[#051428] text-white flex flex-col overflow-hidden select-none font-sans">
      {/* Top authentic brand hairline strip: Blue -> Magenta -> Gold -> Green */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#091E3A]" />
        <div className="w-44 bg-[#E6007E]" />
        <div className="w-36 bg-[#FFCC00]" />
        <div className="w-28 bg-[#00883E]" />
      </div>

      {/* TV Header Bar */}
      <header className="px-6 py-3.5 bg-[#091E3A] border-b border-[#1E3A60] flex flex-wrap items-center justify-between shadow-lg gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 flex items-center justify-center shrink-0 drop-shadow-lg">
            <UCULogo size={48} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-serif font-black tracking-tight text-white">
                UGANDA CHRISTIAN UNIVERSITY
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                selectedHall === 'ACADEMICS'
                  ? 'bg-[#E5B53B]/20 text-[#FFD700] border-[#E5B53B]/50'
                  : 'bg-[#E6007E]/20 text-[#FCE7F3] border-[#E6007E]/50'
              }`}>
                {selectedHall === 'ACADEMICS' ? 'Academic Registrar Desk' : 'Main Campus Mukono'}
              </span>
            </div>
            <p className="text-xs text-[#FFD700] font-semibold tracking-wide flex items-center gap-1.5">
              {selectedHall === 'ACADEMICS' ? (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-[#FFD700]" />
                  Office of the Academic Registrar — Course Registration & Stamp Display
                </>
              ) : selectedHall === 'ACCOUNTS' ? (
                <>
                  <Building2 className="w-3.5 h-3.5 text-[#FFD700]" />
                  Directorate of Finance & Accounts — Live Counter Calling System
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5 text-[#FFD700]" />
                  Central Campus Counter Display — Finance & Academics Desks (Counters 1–5)
                </>
              )}
            </p>
          </div>
        </div>

        {/* Hall View Switcher (Academics Office / Accounts / All) */}
        <div className="flex items-center gap-2 bg-[#051428] p-1 rounded-xl border border-[#1E3A60]">
          <button
            onClick={() => setSelectedHall('ACADEMICS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedHall === 'ACADEMICS'
                ? 'bg-[#E5B53B] text-[#091E3A] shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-[#102A4C]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Academics Office TV
          </button>
          <button
            onClick={() => setSelectedHall('ACCOUNTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedHall === 'ACCOUNTS'
                ? 'bg-[#091E3A] text-[#FFD700] shadow-md border border-[#E5B53B]/60'
                : 'text-slate-300 hover:text-white hover:bg-[#102A4C]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Accounts Hall TV
          </button>
          <button
            onClick={() => setSelectedHall('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedHall === 'ALL'
                ? 'bg-[#091E3A] text-white shadow-md border border-slate-500'
                : 'text-slate-300 hover:text-white hover:bg-[#102A4C]'
            }`}
          >
            All Desks (1–5)
          </button>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-lg font-mono font-bold text-white">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-[11px] text-slate-300">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-[#102A4C] hover:bg-[#183966] text-slate-300 border border-[#1E3A60] transition-colors"
            title="Toggle Chime & Announcements"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> Exit TV View
          </button>
        </div>
      </header>

      {/* TV Main Grid */}
      <div className="flex-1 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Big Attention Panel: NOW CALLING */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="bg-gradient-to-br from-[#091E3A] via-[#102A4C] to-[#0A1D36] rounded-3xl p-8 border-2 border-[#C69214] shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-center">
            
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-[#C69214] text-[#091E3A] shadow-md animate-pulse">
                {nowCalled?.status === 'SERVING' ? 'NOW SERVING' : 'NOW CALLING'}
              </span>
              <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                {selectedHall === 'ACADEMICS' ? 'Academics Registry Wing' : 'Uganda Christian University Mukono'}
              </span>
            </div>

            {nowCalled ? (
              <div className="text-center my-6">
                <div className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono tracking-tight text-white drop-shadow-md">
                  {nowCalled.queue_number}
                </div>

                <div className="mt-6 inline-block bg-[#051428] px-8 py-4 rounded-2xl border border-[#1E3A60] shadow-inner">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Please Proceed Immediately To:
                  </span>
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#D4AF37] block mt-1">
                    {nowCalled.assigned_counter || (selectedHall === 'ACADEMICS' ? 'Counter 5 — Academics Office' : 'Counter 1')}
                  </span>
                </div>

                <div className="mt-4 text-slate-200 text-sm space-y-1">
                  <div>
                    Student: <strong className="text-white text-base">{nowCalled.student_name}</strong> ({nowCalled.student_number})
                  </div>
                  {selectedHall === 'ACADEMICS' && (
                    <div className="text-xs text-amber-300 flex items-center justify-center gap-1.5 font-medium">
                      <Award className="w-3.5 h-3.5" /> Please present your printed Course Unit Card and 45% clearance receipt for stamping.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Clock className="w-16 h-16 mx-auto mb-3 opacity-40 text-slate-500" />
                <h2 className="text-2xl font-bold text-slate-200">
                  {selectedHall === 'ACADEMICS' ? 'Counter 5 Ready for Next Student' : 'All Counters Available'}
                </h2>
                <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  {selectedHall === 'ACADEMICS'
                    ? 'Students with verified 45% tuition clearance may submit course registration in the portal to receive a digital stamping ticket.'
                    : 'Take a digital pass from your student portal or wait for the next ticket call.'}
                </p>
              </div>
            )}

            {/* Bottom Footer Info Bar */}
            <div className="pt-4 border-t border-[#1E3A60] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                CampusQ Verified Dispatch
              </span>
              <span>Priority: Verified FIFO Stamping Order</span>
            </div>
          </div>

          {/* Academics Office Live Performance Ticker (Visible in Academics or All mode) */}
          {selectedHall === 'ACADEMICS' && (
            <div className="mt-4 p-4 bg-[#091E3A]/90 rounded-2xl border border-[#1E3A60] flex items-center justify-around text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Registrations Stamped Today</span>
                <span className="text-xl font-mono font-black text-emerald-400">{stampedCount}</span>
              </div>
              <div className="w-px h-8 bg-[#1E3A60]" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">In Stamping Queue</span>
                <span className="text-xl font-mono font-black text-amber-400">{waitingList.length || pendingStampCount}</span>
              </div>
              <div className="w-px h-8 bg-[#1E3A60]" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg. Stamping Time</span>
                <span className="text-xl font-mono font-black text-blue-300">~3.5 mins</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Active Counters & Upcoming Queue */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Active Counters Grid */}
          <div className="bg-[#091E3A] p-5 rounded-2xl border border-[#1E3A60] shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {selectedHall === 'ACADEMICS' ? 'Academics Office Counter' : 'Active Counter Desks'}
              </h3>
              <span className="text-[10px] text-slate-400">
                {displayCounters.length} Desks Active
              </span>
            </div>

            <div className={`grid gap-3 ${displayCounters.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {displayCounters.map((c) => {
                const match = safeQueue.find((q) => q.assigned_counter?.startsWith(c.name));
                const isAcademics = c.hall === 'ACADEMICS';

                return (
                  <div
                    key={c.name}
                    className={`p-3.5 bg-[#051428] rounded-xl border flex flex-col justify-between ${
                      isAcademics ? 'border-[#E5B53B]/50 bg-[#071933]' : 'border-[#1E3A60]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          {isAcademics && <GraduationCap className="w-3.5 h-3.5 text-[#E5B53B]" />}
                          {c.name}
                        </span>
                        {isAcademics && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#E5B53B]/20 text-[#FFD700]">
                            Academics
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-300 block line-clamp-1 mt-0.5">{c.role}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Officer: {c.assigned}</span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#1E3A60]/60 flex items-center justify-between">
                      {match ? (
                        <span className="font-mono font-black text-xs text-[#D4AF37]">
                          {match.queue_number}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Idle / Ready</span>
                      )}
                      <span
                        className={`w-2 h-2 rounded-full ${
                          match ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Up in Queue */}
          <div className="bg-[#091E3A] p-5 rounded-2xl border border-[#1E3A60] shadow-lg flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A60]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {selectedHall === 'ACADEMICS' ? 'Next in Stamping Queue' : 'Next in Queue'}
              </h3>
              <span className="text-xs text-slate-300 font-semibold">
                {waitingList.length} Waiting
              </span>
            </div>

            <div className="flex-1 mt-3 space-y-2 overflow-y-auto max-h-56">
              {waitingList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No upcoming passes currently waiting
                </div>
              ) : (
                waitingList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#051428] rounded-xl border border-[#1E3A60] flex items-center justify-between hover:border-[#E5B53B]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#132E52] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-mono font-bold text-sm text-white block">
                          {item.queue_number}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                          {item.student_name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-slate-300 block">
                        ~{(idx + 1) * (selectedHall === 'ACADEMICS' ? 4 : 5)} mins
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase">Wait Est.</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Recent Stamped Cards Ticker in Academics Mode */}
            {selectedHall === 'ACADEMICS' && recentStamped.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#1E3A60]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Recently Stamped & Cleared
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {recentStamped.map((r) => (
                    <div key={r.id} className="p-2 bg-[#051428] rounded-lg border border-emerald-500/30 text-[10px]">
                      <span className="font-mono font-bold text-emerald-300 block truncate">
                        {r.registration_code}
                      </span>
                      <span className="text-slate-400 block truncate">
                        {r.student_name || r.student_number}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

