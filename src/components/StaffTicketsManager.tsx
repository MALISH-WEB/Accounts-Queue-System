import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Search
} from 'lucide-react';
import { apiRequest } from '../lib/api';

export const StaffTicketsManager: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Message & Internal note
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalOnly, setIsInternalOnly] = useState(false);
  const [sending, setSending] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/tickets');
      setTickets(data || []);
      if (data && data.length > 0 && !selectedTicket) {
        loadTicketDetails(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTicketDetails = async (id: string) => {
    try {
      const t = await apiRequest<any>(`/tickets/${id}`);
      setSelectedTicket(t);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setSending(true);
    try {
      await apiRequest(`/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: replyMessage.trim(),
          isInternalOnly,
        }),
      });

      setReplyMessage('');
      setIsInternalOnly(false);
      await loadTicketDetails(selectedTicket.id);
    } catch (err: any) {
      alert(err.message || 'Failed to post message');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const updated = await apiRequest<any>(`/tickets/${selectedTicket.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setSelectedTicket(updated);
      await loadTickets();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicket) return;
    const reason = prompt('Document reason for escalation to Senior Officer / Supervisor:');
    if (!reason) return;

    try {
      const updated = await apiRequest<any>(`/tickets/${selectedTicket.id}/escalate`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      setSelectedTicket(updated);
      alert('Ticket successfully escalated to Supervisor.');
      await loadTickets();
    } catch (err: any) {
      alert(err.message || 'Escalation failed');
    }
  };

  const filtered = tickets.filter((t) => {
    const matchesFilter = filter === 'ALL' || t.status === filter;
    const matchesSearch =
      !search ||
      t.ticket_number?.toLowerCase().includes(search.toLowerCase()) ||
      t.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.student_number?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left List of Tickets */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Service Helpdesk Tickets</h3>
            <span className="text-xs text-slate-500 font-semibold">{tickets.length} total</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket # or student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg text-[11px]">
              {['ALL', 'WAITING', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${
                    filter === st ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map((t) => {
            const isSelected = selectedTicket?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => loadTicketDetails(t.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#091E3A]">{t.ticket_number}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      t.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'ESCALATED'
                        ? 'bg-rose-100 text-rose-800'
                        : t.status === 'WAITING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {t.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="font-bold text-slate-900 mt-1">{t.student_name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{t.student_number}</div>
                <div className="text-[11px] text-slate-600 mt-1 line-clamp-1">{t.service_name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Ticket Thread & Action Desk */}
      <div className="lg:col-span-7">
        {selectedTicket ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#091E3A] text-xs">
                    {selectedTicket.ticket_number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {selectedTicket.status.replace(/_/g, ' ')}
                  </span>
                  {selectedTicket.priority === 'HIGH' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      HIGH PRIORITY
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{selectedTicket.service_name}</h3>
                <p className="text-xs text-slate-600">
                  Student: <strong>{selectedTicket.student_name}</strong> ({selectedTicket.student_number}) • {selectedTicket.programme}
                </p>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-1.5">
                {selectedTicket.status !== 'RESOLVED' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('IN_PROGRESS')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-md"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={handleEscalate}
                      className="px-2 py-1 text-[11px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-md flex items-center gap-1"
                      title="Escalate to Supervisor"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      Escalate
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                <span className="font-bold text-slate-900 block mb-1">Original Student Inquiry:</span>
                {selectedTicket.description}
              </div>

              {selectedTicket.messages?.map((m: any) => {
                const isInternal = !!m.is_internal_only;
                const isStudent = m.sender_role === 'STUDENT';

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      isInternal ? 'items-center' : isStudent ? 'items-start' : 'items-end'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-700">{m.sender_name}</span>
                      {isInternal && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Internal Staff Note
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-md px-4 py-2 rounded-xl text-xs leading-relaxed ${
                        isInternal
                          ? 'bg-amber-50 border border-amber-200 text-amber-950 font-medium'
                          : isStudent
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-[#091E3A] text-white'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Staff Reply Box */}
            <div className="p-3 border-t border-slate-100 bg-white">
              <form onSubmit={handleSendMessage} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={isInternalOnly}
                      onChange={(e) => setIsInternalOnly(e.target.checked)}
                      className="rounded text-[#091E3A]"
                    />
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Internal staff note (hidden from student)</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={
                      isInternalOnly
                        ? 'Write internal audit note (e.g. Bank statement checked)...'
                        : 'Reply to student...'
                    }
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-4 py-2 bg-[#091E3A] hover:bg-[#132E52] text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800">Select a Ticket to Review</h4>
          </div>
        )}
      </div>
    </div>
  );
};
