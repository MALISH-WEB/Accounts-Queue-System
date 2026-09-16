import React, { useState, useEffect } from 'react';
import {
  Users,
  Volume2,
  CheckCircle2,
  UserX,
  Play,
  Clock,
  ArrowRight,
  Shield,
  Monitor,
  Award
} from 'lucide-react';
import { apiRequest } from '../lib/api';

interface StaffQueueOperatorProps {
  onOpenTvDisplay: () => void;
}

export const StaffQueueOperator: React.FC<StaffQueueOperatorProps> = ({ onOpenTvDisplay }) => {
  const [activeQueue, setActiveQueue] = useState<any[]>([]);
  const [currentServing, setCurrentServing] = useState<any | null>(null);
  const [assignedCounter, setAssignedCounter] = useState('Counter 1 — Cashier & Verification');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadQueue = async () => {
    try {
      const data = await apiRequest<any[]>('/queues');
      const queueList = Array.isArray(data) ? data : [];
      setActiveQueue(queueList);

      // Check if current counter has someone called or serving
      const activeAtCounter = queueList.find(
        (q) => (q.status === 'CALLED' || q.status === 'SERVING') && q.assigned_counter === assignedCounter
      );
      setCurrentServing(activeAtCounter || null);
    } catch (err) {
      console.error('Failed to load queue in operator desk:', err);
      setActiveQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 4000);
    return () => clearInterval(interval);
  }, [assignedCounter]);

  const handleCallNext = async () => {
    setProcessing(true);
    try {
      const called = await apiRequest<any>('/queues/call-next', {
        method: 'POST',
        body: JSON.stringify({ counter: assignedCounter }),
      });
      setCurrentServing(called);
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'No students currently waiting in queue');
    } finally {
      setProcessing(false);
    }
  };

  const handleStartServing = async () => {
    if (!currentServing) return;
    setProcessing(true);
    try {
      const updated = await apiRequest<any>(`/queues/${currentServing.id}/serve`, {
        method: 'POST',
      });
      setCurrentServing(updated);
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to start serving');
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!currentServing) return;
    setProcessing(true);
    try {
      await apiRequest(`/queues/${currentServing.id}/complete`, {
        method: 'POST',
      });
      setCurrentServing(null);
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to complete service');
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = async () => {
    if (!currentServing) return;
    if (!confirm('Mark student absent and skip?')) return;
    setProcessing(true);
    try {
      await apiRequest(`/queues/${currentServing.id}/skip`, {
        method: 'POST',
      });
      setCurrentServing(null);
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to skip');
    } finally {
      setProcessing(false);
    }
  };

  const waitingList = (Array.isArray(activeQueue) ? activeQueue : []).filter((q) => q.status === 'WAITING');

  return (
    <div className="space-y-6">
      {/* Top Header with Counter Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            UCU Accounts Office
          </span>
          <h2 className="text-base font-bold text-slate-900">Physical Counter & Queue Operator Desk</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student attendance at physical counters, call next ticket, and sync to public TV displays.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 block mb-1">Assigned Counter Desk</label>
            <select
              value={assignedCounter}
              onChange={(e) => setAssignedCounter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-[#091E3A] focus:outline-none"
            >
              <option value="Counter 1 — Cashier & Verification">Counter 1 — Cashier & Verification</option>
              <option value="Counter 2 — Bank Slip Reconciliation">Counter 2 — Bank Slip Reconciliation</option>
              <option value="Counter 3 — Course & Exam Clearance">Counter 3 — Course & Exam Clearance</option>
              <option value="Counter 4 — Financial Holds & Appeals">Counter 4 — Financial Holds & Appeals</option>
              <option value="Counter 5 — Academics Office: Registration & Stamping Desk">Counter 5 — Academics Office: Registration & Stamping Desk</option>
            </select>
          </div>

          <button
            onClick={onOpenTvDisplay}
            className="mt-4 px-3 py-1.5 text-xs font-semibold text-white bg-[#102A4C] hover:bg-[#183966] rounded-lg transition-colors flex items-center gap-1.5 border border-[#1E3A60]"
          >
            <Monitor className="w-3.5 h-3.5 text-[#C69214]" />
            TV Screen
          </button>
        </div>
      </div>

      {/* Active Serving Hero Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#091E3A] text-white rounded-xl p-6 shadow-md border border-[#1E3A60]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              {assignedCounter}
            </span>
            <span className="text-xs text-slate-300">
              {waitingList.length} students waiting in queue
            </span>
          </div>

          {currentServing ? (
            <div>
              <div className="bg-[#051428] p-5 rounded-xl border border-[#1E3A60]">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-900 text-blue-200">
                      Status: {currentServing.status}
                    </span>
                    <h3 className="text-3xl font-black font-mono mt-2 text-white">
                      {currentServing.queue_number}
                    </h3>
                    <p className="text-sm font-bold text-[#D4AF37] mt-1">{currentServing.student_name}</p>
                    <p className="text-xs text-slate-300 font-mono">{currentServing.student_number}</p>
                    <p className="text-xs text-slate-400 mt-1">Service: {currentServing.service_name}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Waiting Time</span>
                    <span className="text-sm font-bold text-slate-200">
                      ~{currentServing.estimated_wait_minutes || 5} mins
                    </span>
                  </div>
                </div>

                {/* Operator Actions */}
                <div className="mt-6 pt-4 border-t border-[#1E3A60] flex flex-wrap gap-2">
                  {currentServing.status === 'CALLED' ? (
                    <button
                      onClick={handleStartServing}
                      disabled={processing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Serving
                    </button>
                  ) : (
                    <button
                      onClick={handleComplete}
                      disabled={processing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete Service
                    </button>
                  )}

                  {/* If Academics Stamp Service, provide one-click Stamp & Endorsement */}
                  {(currentServing.service_code === 'ACAD-01' || assignedCounter.includes('Academics')) && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Affix official Academic Registrar stamp and endorse course registration for ${currentServing.student_name}?`)) return;
                        setProcessing(true);
                        try {
                          const regRes = await apiRequest<any>(`/registrations/my-registration?studentId=${currentServing.student_id}`);
                          if (regRes?.registration?.id) {
                            await apiRequest(`/registrations/${regRes.registration.id}/stamp`, {
                              method: 'POST',
                              body: JSON.stringify({ staffName: `Staff at ${assignedCounter}` })
                            });
                          }
                          await handleComplete();
                          alert(`Official Academic Registrar stamp affixed for ${currentServing.student_name}!`);
                        } catch (err: any) {
                          alert(err.message || 'Failed to stamp registration');
                        } finally {
                          setProcessing(false);
                        }
                      }}
                      disabled={processing}
                      className="px-4 py-2 bg-gradient-to-r from-[#C69214] to-[#E5B53B] hover:from-[#B38012] hover:to-[#D4AF37] text-[#091E3A] text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Award className="w-3.5 h-3.5 text-[#091E3A]" /> Affix Academic Stamp & Complete
                    </button>
                  )}

                  <button
                    onClick={handleSkip}
                    disabled={processing}
                    className="px-3 py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <UserX className="w-3.5 h-3.5" /> Mark Absent / Skip
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-[#051428] rounded-xl border border-[#1E3A60]">
              <Users className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-200 mt-2">Counter Currently Idle</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Ready to attend to students? Call the next waiting ticket in accordance with FIFO rules.
              </p>

              <button
                onClick={handleCallNext}
                disabled={processing || waitingList.length === 0}
                className="mt-5 px-6 py-2.5 bg-[#C69214] hover:bg-[#D4AF37] text-[#091E3A] text-xs font-bold rounded-lg shadow-md transition-colors inline-flex items-center gap-2 disabled:opacity-40"
              >
                <Volume2 className="w-4 h-4" />
                Call Next Student ({waitingList.length} Waiting)
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Waiting List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-[420px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Waiting Queue (FIFO)
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {waitingList.length} in line
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
            {waitingList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No students currently waiting in the virtual queue.
              </div>
            ) : (
              waitingList.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-mono font-bold text-[#091E3A]">{entry.queue_number}</div>
                      <div className="font-medium text-slate-900">{entry.student_name}</div>
                      <div className="text-[10px] text-slate-500">{entry.service_name}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    ~{(idx + 1) * 5} min
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
