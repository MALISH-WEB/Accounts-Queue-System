import React from 'react';
import {
  CheckCircle2,
  GraduationCap,
  CreditCard,
  HelpCircle,
  Users,
  FileCheck,
  Search,
  BarChart3,
  Monitor,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  UserCheck,
  X,
  Sparkles,
  ShieldAlert,
  Award
} from 'lucide-react';
import { UserSession } from '../lib/api';
import { UCULogo } from './UCULogo';

export interface TabItem {
  id: string;
  label: string;
  shortLabel: string;
  category: 'STUDENT' | 'STAFF' | 'GOVERNANCE' | 'TOOLS';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const ALL_SYSTEM_TABS: TabItem[] = [
  // 1. Student Services Category (Growth, Life & Knowledge)
  {
    id: 'clearance',
    label: 'Financial Clearance & 45%',
    shortLabel: 'Clearance & 45%',
    category: 'STUDENT',
    description: 'Statutory 45% threshold verification, clearance standing, and deficit calculator.',
    icon: CheckCircle2,
    badge: '45% Rule',
    badgeColor: 'bg-[#DCFCE7] text-[#14532D] border-[#86EFAC]', // UCU Green: Growth & Life
  },
  {
    id: 'academics-registration',
    label: 'Course Registration & Stamp',
    shortLabel: 'Registration & Stamp',
    category: 'STUDENT',
    description: 'Submit course units request and join queue in the Academics Office for official stamp.',
    icon: Award,
    badge: 'Stamp Queue',
    badgeColor: 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]', // UCU Gold
  },
  {
    id: 'programmes',
    label: 'Programme Tuition Gazette',
    shortLabel: 'Tuition Gazette',
    category: 'STUDENT',
    description: 'Official academic programme fee schedules, itemized functional fees, and policies.',
    icon: GraduationCap,
    badge: 'Gazette',
    badgeColor: 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]', // UCU Gold: Excellence & Quality
  },
  {
    id: 'payments',
    label: 'Payments & Bank Receipts',
    shortLabel: 'Bank Receipts',
    category: 'STUDENT',
    description: 'Submit bank deposit slips, inspect verified ledger, and download official receipts.',
    icon: CreditCard,
    badge: 'Ledger',
    badgeColor: 'bg-blue-50 text-[#091E3A] border-blue-200', // UCU Deep Blue: Trust & Stability
  },
  {
    id: 'services',
    label: 'Digital Accounts Services',
    shortLabel: 'Accounts Desk',
    category: 'STUDENT',
    description: 'Fee appeals, refunds, clearance queries, and instant financial knowledge base.',
    icon: HelpCircle,
  },
  {
    id: 'queue',
    label: 'Virtual Queue & Bookings',
    shortLabel: 'Virtual Queue',
    category: 'STUDENT',
    description: 'Join counter queue remotely or book an appointment with an Accounts Officer.',
    icon: Users,
    badge: 'Live',
    badgeColor: 'bg-[#DCFCE7] text-[#14532D] border-[#86EFAC]', // UCU Green: Sustainability
  },

  // 2. Staff Workstation Category (Wisdom, Stability & Integrity)
  {
    id: 'verification',
    label: 'Payment Verifications',
    shortLabel: 'Verifications',
    category: 'STAFF',
    description: 'Audit submitted student bank deposit slips and approve/reject transactions.',
    icon: FileCheck,
    badge: 'Staff',
    badgeColor: 'bg-[#091E3A] text-[#E5B53B] border-[#1E3A60]', // UCU Deep Blue & Gold
  },
  {
    id: 'queue-desk',
    label: 'Counter Queue Operator',
    shortLabel: 'Operator Desk',
    category: 'STAFF',
    description: 'Manage counter windows, call waiting tickets, and serve in-person inquiries.',
    icon: Users,
    badge: 'Desk',
    badgeColor: 'bg-amber-50 text-[#854D0E] border-amber-200',
  },
  {
    id: 'tickets-manage',
    label: 'Service Tickets & Appeals',
    shortLabel: 'Tickets Desk',
    category: 'STAFF',
    description: 'Review student clearance appeals, refund tokens, and digital inquiries.',
    icon: HelpCircle,
    badge: 'Appeals',
    badgeColor: 'bg-slate-100 text-[#1E293B] border-slate-300',
  },
  {
    id: 'students-lookup',
    label: 'Student Ledgers Search',
    shortLabel: 'Student Ledgers',
    category: 'STAFF',
    description: 'Search student accounts, view transaction histories, and inspect ledger holds.',
    icon: Search,
    badge: 'Lookup',
    badgeColor: 'bg-blue-50 text-[#091E3A] border-blue-200',
  },

  // 3. Institutional Governance Category (Executive Guidance)
  {
    id: 'reports',
    label: 'Analytics & Avoided Visits',
    shortLabel: 'KPI Analytics',
    category: 'GOVERNANCE',
    description: 'Executive KPI dashboard, physical visit reduction rates, and audit logs.',
    icon: BarChart3,
    badge: 'Exec',
    badgeColor: 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]', // UCU Gold
  },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  session: UserSession | null;
  onOpenLiveQueue: () => void;
  onOpenMakePayment?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  session,
  onOpenLiveQueue,
  onOpenMakePayment,
}) => {
  const userRole = session?.user.role || 'STUDENT';
  const isStudent = userRole === 'STUDENT';
  const isSupervisor = userRole === 'ACCOUNTS_SUPERVISOR';
  const isStaff = userRole === 'ACCOUNTS_OFFICER' || userRole === 'SENIOR_ACCOUNTS_OFFICER' || isSupervisor;

  // Filter tabs strictly based on authenticated role
  const studentTabs = ALL_SYSTEM_TABS.filter((t) => t.category === 'STUDENT');
  const staffTabs = ALL_SYSTEM_TABS.filter((t) => t.category === 'STAFF');
  const governanceTabs = ALL_SYSTEM_TABS.filter((t) => t.category === 'GOVERNANCE');

  const renderNavGroup = (title: string, tabs: TabItem[], subtitle?: string, accentColor?: string) => {
    return (
      <div className="mb-5">
        {!isCollapsed && (
          <div className="px-3 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {accentColor && (
                <span className={`w-1.5 h-1.5 rounded-full ${accentColor}`} />
              )}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#334155] block">
                  {title}
                </span>
                {subtitle && <span className="text-[9px] text-[#64748B] block">{subtitle}</span>}
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#334155] bg-slate-100 px-1.5 py-0.5 rounded font-bold">
              {tabs.length}
            </span>
          </div>
        )}

        <div className="space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                title={isCollapsed ? `${tab.label}: ${tab.description}` : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-[#091E3A] text-white font-semibold shadow-xs'
                    : 'text-[#1E293B] hover:text-[#091E3A] hover:bg-slate-100/90 font-medium'
                }`}
              >
                {/* Active Gold/Magenta Left Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-[#E6007E] via-[#FFCC00] to-[#00883E] rounded-r-full shadow-xs" />
                )}

                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#102A4C] text-[#E5B53B]'
                      : 'bg-slate-100 text-[#475569] group-hover:text-[#091E3A] group-hover:bg-slate-200/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`truncate text-xs font-semibold ${isActive ? 'text-white' : 'text-[#0F172A]'}`}>
                        {tab.label}
                      </span>
                      {tab.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                            isActive
                              ? 'bg-[#C69214] text-[#091E3A] border-[#E5B53B]'
                              : tab.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] truncate mt-0.5 ${
                        isActive ? 'text-slate-300' : 'text-[#64748B]'
                      }`}
                    >
                      {tab.description}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-200 ease-in-out shadow-lg lg:shadow-none lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Sidebar Header / Brand: Deep Blue & Gold */}
        <div className="h-16 border-b border-slate-200 px-3 flex items-center justify-between bg-slate-50/90 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 flex items-center justify-center shrink-0 drop-shadow-xs">
                <UCULogo size={36} />
              </div>
              <div className="truncate">
                <span className="text-xs font-serif font-black tracking-tight text-[#091E3A] block">
                  UCU Accounts Office
                </span>
                <span className="text-[10px] text-[#64748B] font-medium block truncate">
                  System Navigation • {ALL_SYSTEM_TABS.length} Active Modules
                </span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 flex items-center justify-center mx-auto drop-shadow-xs">
              <UCULogo size={30} />
            </div>
          )}

          {/* Desktop Collapse Toggle / Mobile Close */}
          <div className="flex items-center">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="hidden lg:flex p-1.5 rounded-md hover:bg-slate-200 text-[#475569] hover:text-[#0F172A] transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-md hover:bg-slate-200 text-[#475569]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 space-y-4">
          {/* 1. Student Services Section (Visible ONLY to Students) */}
          {isStudent && (
            <div className="pt-1">
              {renderNavGroup('Student Financial Services', studentTabs, 'Tuition, clearance, receipts & queue', 'bg-[#00883E]')}
            </div>
          )}

          {/* 2. Staff Workstation Section (Visible ONLY to Staff & Supervisors) */}
          {isStaff && (
            <div className="pt-1">
              {renderNavGroup('Staff Operations Desk', staffTabs, 'Verifications, counter desk & ledger search', 'bg-[#0047AB]')}
            </div>
          )}

          {/* 3. Institutional Governance Section (Visible to Supervisors & Leadership) */}
          {isSupervisor && (
            <div className="pt-3">
              {renderNavGroup('Executive Governance', governanceTabs, 'Visit reduction KPIs & audit reports', 'bg-[#FFCC00]')}
            </div>
          )}

          {/* 4. Displays & Direct Tools */}
          <div className="pt-3">
            {!isCollapsed && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#334155] block px-3 mb-2">
                Quick Actions
              </span>
            )}

            <div className="space-y-1.5">
              {/* Counter TV Screen Modal Trigger */}
              <button
                id="sidebar-btn-counter-tv"
                onClick={onOpenLiveQueue}
                title="Open Waiting Hall Counter TV Screen (Accounts & Academics)"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-[#1E293B] hover:bg-amber-50/80 hover:text-[#091E3A] border border-slate-200/90 hover:border-[#FFCC00] transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-[#091E3A] text-[#FFD700] flex items-center justify-center shrink-0 shadow-2xs">
                  <Monitor className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <div className="text-left flex-1 min-w-0">
                    <span className="font-bold text-[#0F172A] group-hover:text-[#091E3A] block truncate">
                      Waiting Hall TV Screen
                    </span>
                    <span className="text-[10px] text-[#64748B] block truncate">
                      Academics & Accounts live display
                    </span>
                  </div>
                )}
              </button>

              {/* Quick Submit Payment Button (Available for students) */}
              {isStudent && onOpenMakePayment && (
                <button
                  id="sidebar-btn-make-payment"
                  onClick={onOpenMakePayment}
                  title="Submit Bank Deposit Slip"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs bg-gradient-to-r from-[#0047AB] to-[#091E3A] hover:from-[#00388A] hover:to-[#06162C] text-white font-bold transition-all shadow-xs border border-[#1E3A60]"
                >
                  <div className="w-7 h-7 rounded-md bg-[#E6007E] text-white flex items-center justify-center shrink-0">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  {!isCollapsed && (
                    <span className="truncate">Submit Bank Deposit Slip</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Authenticated User Identity Status (No persona switching) */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/90 shrink-0">
          {!isCollapsed ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">
                  Access Level:
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isStudent
                      ? 'bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]' // UCU Green: Student Growth
                      : isSupervisor
                      ? 'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047]' // UCU Gold: Executive Supervisor
                      : 'bg-[#091E3A] text-[#FFD700] border border-[#1E3A60]' // UCU Deep Blue: Staff Officer
                  }`}
                >
                  {isStudent
                    ? 'Student Portal'
                    : isSupervisor
                    ? 'Supervisor Level'
                    : 'Accounts Officer'}
                </span>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200 text-left">
                <p className="text-xs font-bold text-[#091E3A] truncate">
                  {session?.user.fullName || 'Authenticated User'}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-mono">
                  {session?.user.student?.registration_number ||
                    session?.user.student?.student_number ||
                    session?.user.staff?.staff_number ||
                    session?.user.email}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-[#00883E] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00883E]" />
                  <span>Session Verified • SSL Active</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              title={`${session?.user.fullName} (${userRole})`}
              className="w-8 h-8 rounded-md bg-[#091E3A] text-[#FFD700] flex items-center justify-center mx-auto text-xs font-bold shadow-2xs"
            >
              {session?.user.fullName ? session.user.fullName[0] : 'U'}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
