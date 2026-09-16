import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Monitor,
  Video,
  MapPin,
  XCircle
} from 'lucide-react';
import { apiRequest } from '../lib/api';

interface VirtualQueueCardProps {
  studentId: string;
  onOpenTvDisplay: () => void;
}

export const VirtualQueueCard: React.FC<VirtualQueueCardProps> = ({
  studentId,
  onOpenTvDisplay,
}) => {
  const [activeEntry, setActiveEntry] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Appointment booking state
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [aptDate, setAptDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [aptType, setAptType] = useState('REMOTE');
  const [aptReason, setAptReason] = useState('');
  const [bookingApt, setBookingApt] = useState(false);
  const [aptSuccess, setAptSuccess] = useState('');

  const loadQueueStatus = async () => {
    try {
      const res = await apiRequest<{ activeEntry: any }>('/queues/my-active');
      setActiveEntry(res.activeEntry);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const srvs = await apiRequest<any[]>('/services');
      setServices(srvs || []);
      if (srvs && srvs.length > 0) {
        setSelectedServiceId(srvs[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSlots = async () => {
    try {
      const slots = await apiRequest<any[]>(`/appointments/slots?date=${aptDate}`);
      setAvailableSlots(slots || []);
      if (slots && slots.length > 0) {
        const firstAvail = slots.find((s) => s.isAvailable);
        if (firstAvail) setSelectedSlot(firstAvail.timeSlot);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadQueueStatus();
    loadServices();
    const interval = setInterval(loadQueueStatus, 5000);
    return () => clearInterval(interval);
  }, [studentId]);

  useEffect(() => {
    if (showAppointmentForm) {
      loadSlots();
    }
  }, [showAppointmentForm, aptDate]);

  const handleJoinQueue = async () => {
    setErrorMsg('');
    setJoining(true);
    try {
      const res = await apiRequest<any>('/queues/join', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedServiceId,
        }),
      });
      setActiveEntry(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join queue');
    } finally {
      setJoining(false);
    }
  };

  const handleCancelQueue = async () => {
    if (!activeEntry) return;
    if (!confirm('Are you sure you want to surrender your position in the virtual queue?')) return;

    try {
      await apiRequest(`/queues/${activeEntry.id}/cancel`, { method: 'POST' });
      setActiveEntry(null);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel queue pass');
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !aptReason.trim()) return;

    setBookingApt(true);
    setAptSuccess('');
    try {
      const apt = await apiRequest<any>('/appointments/book', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          serviceId: selectedServiceId || services[0]?.id,
          appointmentType: aptType,
          scheduledDate: aptDate,
          timeSlot: selectedSlot,
          reason: aptReason.trim(),
        }),
      });

      setAptSuccess(`Appointment ${apt.appointment_number} confirmed for ${aptDate} at ${selectedSlot}.`);
      setAptReason('');
      setTimeout(() => setShowAppointmentForm(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Booking failed');
    } finally {
      setBookingApt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Active Virtual Queue Pass Card */}
      {activeEntry ? (
        <div className="bg-gradient-to-br from-[#091E3A] to-[#132E52] text-white rounded-2xl p-6 shadow-xl border border-[#1E3A60] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#C69214] text-[#091E3A]">
                Active Virtual Queue Pass
              </span>
              <h2 className="text-3xl font-black tracking-tight mt-2 font-mono text-white">
                {activeEntry.queue_number}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Service: <strong>{activeEntry.service_name}</strong>
              </p>
            </div>

            {/* Position & Estimated Wait */}
            <div className="flex items-center gap-4 bg-[#051428] px-4 py-3 rounded-xl border border-[#1E3A60]">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Queue Position</span>
                <span className="text-2xl font-black text-[#D4AF37]">
                  {activeEntry.status === 'CALLED' || activeEntry.status === 'SERVING'
                    ? 'NOW'
                    : `#${activeEntry.position || 1}`}
                </span>
              </div>
              <div className="w-px h-8 bg-[#1E3A60]" />
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Wait</span>
                <span className="text-xl font-bold text-slate-200">
                  {activeEntry.status === 'CALLED' || activeEntry.status === 'SERVING'
                    ? 'Immediate'
                    : `~${activeEntry.estimated_wait_minutes || 5} min`}
                </span>
              </div>
            </div>
          </div>

          {/* Call Alert Banner if Called */}
          {activeEntry.status === 'CALLED' && (
            <div className="mt-5 p-4 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-200">NOW CALLING YOUR NUMBER!</h4>
                  <p className="text-xs text-white">
                    Please proceed immediately to <strong>{activeEntry.assigned_counter || 'Counter 1'}</strong>.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-300 px-3 py-1 bg-emerald-950/60 rounded-md">
                Called Desk
              </span>
            </div>
          )}

          {activeEntry.status === 'SERVING' && (
            <div className="mt-5 p-4 bg-blue-500/20 border border-blue-400/40 rounded-xl">
              <h4 className="text-sm font-bold text-blue-200">Currently Being Served</h4>
              <p className="text-xs text-slate-300">
                You are currently at {activeEntry.assigned_counter}.
              </p>
            </div>
          )}

          {/* Bottom actions */}
          <div className="mt-6 pt-4 border-t border-[#1E3A60] flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Pass issued at: {new Date(activeEntry.created_at).toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenTvDisplay}
                className="px-3 py-1.5 rounded-lg bg-[#102A4C] hover:bg-[#183966] text-white font-medium flex items-center gap-1.5 transition-colors border border-[#2B4C7E]"
              >
                <Monitor className="w-3.5 h-3.5 text-[#C69214]" />
                View TV Display
              </button>
              <button
                onClick={handleCancelQueue}
                className="px-3 py-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 rounded-lg transition-colors font-medium flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                Surrender Pass
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Join Virtual Queue Entry Box */
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              UCU Accounts Office
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Join Intelligent Virtual Queue
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              CampusQ prevents crowded physical queues. Take a digital pass, monitor your real-time position from your hostel or library, and proceed to the Accounts Office counter only when called.
            </p>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Select Accounts Service for Counter Assistance
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#091E3A]"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleJoinQueue}
                disabled={joining}
                className="w-full py-2 px-4 bg-[#091E3A] hover:bg-[#132E52] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Users className="w-4 h-4 text-[#C69214]" />
                {joining ? 'Issuing Pass...' : 'Take Virtual Pass'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Appointment Booking Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#091E3A]" />
              Scheduled Consultation / Google Meet Appointment
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Prefer a dedicated 30-minute one-on-one session? Book a remote video consultation or reserved desk slot during Accounts working hours (08:30 – 16:30).
            </p>
          </div>

          <button
            onClick={() => setShowAppointmentForm(!showAppointmentForm)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            {showAppointmentForm ? 'Close Form' : '+ Book Consultation'}
          </button>
        </div>

        {showAppointmentForm && (
          <form onSubmit={handleBookAppointment} className="mt-5 pt-5 border-t border-slate-100 space-y-4">
            {aptSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{aptSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Appointment Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAptType('REMOTE')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                      aptType === 'REMOTE'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 font-semibold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                    Remote (Meet)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAptType('PHYSICAL_COUNTER')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                      aptType === 'PHYSICAL_COUNTER'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 font-semibold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#091E3A]" />
                    In-Person Desk
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={aptDate}
                  onChange={(e) => setAptDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Available Slot</label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                >
                  {availableSlots.map((s) => (
                    <option key={s.timeSlot} value={s.timeSlot} disabled={!s.isAvailable}>
                      {s.timeSlot} {s.isAvailable ? '(Available)' : '(Booked)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for Appointment
              </label>
              <input
                type="text"
                required
                placeholder="e.g. State sponsorship voucher reconciliation, complex ledger audit..."
                value={aptReason}
                onChange={(e) => setAptReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={bookingApt}
                className="px-4 py-2 bg-[#091E3A] hover:bg-[#132E52] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {bookingApt ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
