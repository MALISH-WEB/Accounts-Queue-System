import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  PlusCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  Shield,
  FileText,
  ChevronRight
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { FAQSection } from './FAQSection';

interface StudentDigitalServicesProps {
  studentId: string;
  onOpenQueue: () => void;
}

export const StudentDigitalServices: React.FC<StudentDigitalServicesProps> = ({
  studentId,
  onOpenQueue,
}) => {
  const [services, setServices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);

  // New ticket form
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketDescription, setTicketDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Message reply
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const loadData = async () => {
    try {
      const [srvData, tckData] = await Promise.all([
        apiRequest<any[]>('/services'),
        apiRequest<any[]>(`/tickets?studentId=${studentId}`),
      ]);
      setServices(Array.isArray(srvData) ? srvData : []);
      const ticketList = Array.isArray(tckData) ? tckData : [];
      setTickets(ticketList);

      if (ticketList.length > 0 && !activeTicket) {
        // Load details of the first ticket
        loadTicketDetails(ticketList[0].id);
      }
    } catch (err) {
      console.error('Failed to load services or tickets:', err);
      setServices([]);
      setTickets([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadTicketDetails = async (ticketId: string) => {
    try {
      const fullTicket = await apiRequest<any>(`/tickets/${ticketId}`);
      setActiveTicket(fullTicket);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !ticketDescription.trim()) return;

    setSubmitting(true);
    try {
      const newTicket = await apiRequest<any>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          serviceId: selectedService.id,
          description: ticketDescription.trim(),
          category: selectedService.category_name,
        }),
      });

      setTicketDescription('');
      setIsCreatingTicket(false);
      setSelectedService(null);
      await loadData();
      setActiveTicket(newTicket);
    } catch (err: any) {
      alert(err.message || 'Failed to open ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      await apiRequest(`/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: replyMessage.trim(),
          isInternalOnly: false,
        }),
      });

      setReplyMessage('');
      await loadTicketDetails(activeTicket.id);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Accounts Services Catalog & My Tickets */}
      <div className="lg:col-span-5 space-y-6">
        {/* Service Catalog */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">UCU Accounts Office Services</h3>
            <span className="text-[11px] text-slate-500 font-medium">{services.length} available</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Select a service to resolve inquiries digitally without queuing physically at the office.
          </p>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {services.map((srv) => (
              <button
                key={srv.id}
                onClick={() => {
                  setSelectedService(srv);
                  setIsCreatingTicket(true);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex items-center justify-between ${
                  selectedService?.id === srv.id
                    ? 'border-[#091E3A] bg-[#091E3A]/5 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <h4 className="font-semibold text-slate-900">{srv.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{srv.description}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      ~{srv.estimated_processing_time_minutes} min response
                    </span>
                    {srv.is_self_service_supported && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                        Instant Online
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>

        {/* Existing Tickets List */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">My Service Tickets</h3>
          {tickets.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              You do not have any open service tickets.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => loadTicketDetails(t.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#091E3A] text-[11px]">
                        {t.ticket_number}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.status === 'RESOLVED' || t.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'WAITING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 mt-1 line-clamp-1">{t.service_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Ticket Creation Modal or Active Thread */}
      <div className="lg:col-span-7">
        {isCreatingTicket && selectedService ? (
          /* New Ticket Form */
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  New Accounts Request
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedService.name}</h3>
              </div>
              <button
                onClick={() => setIsCreatingTicket(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                <p><strong>Category:</strong> {selectedService.category_name}</p>
                <p className="mt-1">{selectedService.description}</p>
                {selectedService.required_documents && (
                  <p className="mt-2 text-slate-500">
                    <strong>Required info/docs:</strong> {selectedService.required_documents}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Describe your inquiry or reconciliation request in detail: *
                </label>
                <textarea
                  required
                  rows={4}
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Include bank details, transaction reference numbers, dates deposited, or reason for clearance appeal..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#091E3A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingTicket(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#091E3A] hover:bg-[#132E52] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting Ticket...' : 'Open Service Ticket'}
                </button>
              </div>
            </form>
          </div>
        ) : activeTicket ? (
          /* Active Ticket Details & Message Thread */
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[560px]">
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#091E3A] text-xs">
                    {activeTicket.ticket_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      activeTicket.status === 'RESOLVED' || activeTicket.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {activeTicket.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{activeTicket.service_name}</h3>
                <p className="text-xs text-slate-500">
                  Assigned Staff: <strong>{activeTicket.assigned_staff_name || 'Accounts Desk'}</strong>
                </p>
              </div>

              {activeTicket.status === 'RESOLVED' && (
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-emerald-700 block">
                    Resolved by Accounts
                  </span>
                </div>
              )}
            </div>

            {/* Message Thread Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTicket.messages?.map((m: any) => {
                const isStudent = m.sender_role === 'STUDENT';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-700">{m.sender_name}</span>
                      <span>•</span>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`max-w-md px-4 py-2.5 rounded-xl text-xs leading-relaxed ${
                        isStudent
                          ? 'bg-[#091E3A] text-white rounded-br-xs shadow-xs'
                          : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Box */}
            <div className="p-3 border-t border-slate-100 bg-white">
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message or provide further details..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#091E3A]"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyMessage.trim()}
                  className="px-4 py-2 bg-[#091E3A] hover:bg-[#132E52] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm mt-3">Select a Service or Ticket</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Choose an Accounts service from the catalog to submit an inquiry, or click an existing ticket to view communication.
            </p>
          </div>
        )}
      </div>
    </div>

    {/* Quick-Access Knowledge Base & FAQs on Clearance, Late Fees, and Refunds */}
    <FAQSection
      onSelectServiceQuery={(questionText) => {
        const query = questionText.toLowerCase();
        const matched = services.find((s) => {
          const sName = s.name.toLowerCase();
          if (query.includes('late')) return sName.includes('late') || sName.includes('appeal');
          if (query.includes('refund')) return sName.includes('refund') || sName.includes('excess');
          if (query.includes('deposit') || query.includes('bank') || query.includes('slip')) {
            return sName.includes('reconciliation') || sName.includes('verification');
          }
          if (query.includes('hold') || query.includes('clearance')) {
            return sName.includes('clearance') || sName.includes('hold');
          }
          return false;
        });

        if (matched) {
          setSelectedService(matched);
        } else if (services.length > 0) {
          setSelectedService(services[0]);
        }
        setIsCreatingTicket(true);
        setTicketDescription(`Inquiry regarding policy: ${questionText}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    />
  </div>
  );
};
