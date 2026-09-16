import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { AccessRestricted } from './components/AccessRestricted';
import { StudentFinancialOverview } from './components/StudentFinancialOverview';
import { StudentPaymentsList } from './components/StudentPaymentsList';
import { StudentDigitalServices } from './components/StudentDigitalServices';
import { VirtualQueueCard } from './components/VirtualQueueCard';
import { ProgrammeFeeStructures } from './components/ProgrammeFeeStructures';
import { StaffPaymentVerification } from './components/StaffPaymentVerification';
import { StaffQueueOperator } from './components/StaffQueueOperator';
import { StaffTicketsManager } from './components/StaffTicketsManager';
import { StudentLedgersLookup } from './components/StudentLedgersLookup';
import { SupervisorReports } from './components/SupervisorReports';
import { PublicQueueDisplay } from './components/PublicQueueDisplay';
import { PaymentSubmissionModal } from './components/PaymentSubmissionModal';
import { AcademicsRegistrationPage } from './components/AcademicsRegistrationPage';
import { UserSession, getSession, setSession, apiRequest } from './lib/api';
import { FinancialEligibilityResult } from './types';

export default function App() {
  const [session, setCurrentSessionState] = useState<UserSession | null>(getSession());
  const [activeTab, setActiveTab] = useState<string>('clearance');
  const [eligibility, setEligibility] = useState<FinancialEligibilityResult | null>(null);
  const [studentAccount, setStudentAccount] = useState<any | null>(null);
  const [, setLoading] = useState(false);

  // Sidebar responsive state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTvDisplay, setShowTvDisplay] = useState(false);
  const [tvInitialHall, setTvInitialHall] = useState<'ALL' | 'ACADEMICS' | 'ACCOUNTS'>('ALL');

  // Set default starting tab based on role when session is established
  const setInitialTabForRole = (role: string) => {
    if (role === 'STUDENT') {
      setActiveTab('clearance');
    } else if (role === 'ACCOUNTS_SUPERVISOR') {
      setActiveTab('reports');
    } else {
      setActiveTab('verification');
    }
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setCurrentSessionState(newSession);
    setInitialTabForRole(newSession.user.role);
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentSessionState(null);
    setEligibility(null);
    setStudentAccount(null);
  };

  // Fetch financial eligibility when student session is active or requested
  const loadFinancialData = async (targetStudentId?: string) => {
    if (!session || session.user.role !== 'STUDENT') return;
    const studentId = targetStudentId || session?.user.student?.id || 'STU_1';
    setLoading(true);
    try {
      const [eligRes, accRes] = await Promise.all([
        apiRequest<FinancialEligibilityResult>(
          `/financial/registration-eligibility/check?studentId=${studentId}`
        ),
        apiRequest<any>(`/financial/accounts/${studentId}`),
      ]);
      setEligibility(eligRes);
      setStudentAccount(accRes);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.user.role === 'STUDENT') {
      loadFinancialData();
    }
  }, [session]);

  const studentId = session?.user.student?.id || 'STU_1';
  const userRole = session?.user.role;
  const isStudent = userRole === 'STUDENT';
  const isSupervisor = userRole === 'ACCOUNTS_SUPERVISOR';
  const isStaff = userRole === 'ACCOUNTS_OFFICER' || userRole === 'SENIOR_ACCOUNTS_OFFICER' || isSupervisor;

  // Check RBAC permissions for current tab
  const isTabAllowedForRole = (tab: string): boolean => {
    if (tab === 'programmes') return true; // Public institutional policy gazette
    if (isStudent) {
      return ['clearance', 'academics-registration', 'payments', 'services', 'queue'].includes(tab);
    }
    if (isSupervisor) {
      return ['verification', 'queue-desk', 'tickets-manage', 'students-lookup', 'reports', 'academics-registration'].includes(tab);
    }
    if (isStaff) {
      return ['verification', 'queue-desk', 'tickets-manage', 'students-lookup', 'academics-registration'].includes(tab);
    }
    return false;
  };

  // If no authenticated session exists, render the dedicated LoginPage
  if (!session) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'clearance':
        return 'Financial Clearance & 45% Check';
      case 'academics-registration':
        return 'Course Registration & Academics Stamp Queue';
      case 'programmes':
        return 'Programme Tuition Gazette & Policies';
      case 'payments':
        return 'Payments & Official Bank Receipts';
      case 'services':
        return 'Digital Accounts Services & FAQ';
      case 'queue':
        return 'Virtual Queue & Appointments';
      case 'verification':
        return 'Staff Payment Verifications';
      case 'queue-desk':
        return 'Counter Queue Operator Desk';
      case 'tickets-manage':
        return 'Service Tickets & Appeals';
      case 'students-lookup':
        return 'Student Financial Ledgers';
      case 'reports':
        return 'Executive Analytics & Avoided Visits';
      default:
        return 'Accounts Office Portal';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col font-sans selection:bg-[#E6007E] selection:text-white">
      {/* 1. Header Navigation (Hero with only Logo, Notification, Authenticated User Identity) */}
      <Navbar
        session={session}
        onOpenLiveQueue={() => setShowTvDisplay(true)}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 2. Active Sub-bar with View Context & Semester Info (UCU Brand Accents) */}
      <div className="bg-white border-b border-slate-200/90 shadow-2xs shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider hidden sm:inline">
              Active Module:
            </span>
            <span className="font-bold text-[#091E3A] px-2.5 py-0.5 rounded-md bg-[#FDF2F8] border border-[#FBCFE8] text-[#BE0061] truncate shadow-2xs">
              {getActiveTabTitle()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#334155] shrink-0 font-medium">
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00883E]" />
              Easter Semester 2025/2026
            </span>
            <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-[#0F172A] border border-slate-200 font-bold">
              UGX Currency
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Layout Container: Sidebar + Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar Navigation: Filtered strictly by role */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          session={session}
          onOpenLiveQueue={() => {
            setTvInitialHall('ALL');
            setShowTvDisplay(true);
          }}
          onOpenMakePayment={() => setShowPaymentModal(true)}
        />

        {/* Main Content View Area */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {!isTabAllowedForRole(activeTab) ? (
              <AccessRestricted
                userRole={userRole || 'UNKNOWN'}
                requiredRoleDescription={
                  isStudent
                    ? 'Staff Workstation or Supervisor privileges'
                    : 'Enrolled Student Account credentials'
                }
                onReturnToAllowed={() => setInitialTabForRole(userRole || 'STUDENT')}
              />
            ) : (
              /* Authorized Tab View Components */
              <div className="space-y-6">
                {/* 1. Financial Clearance & 45% Check */}
                {activeTab === 'clearance' && isStudent && (
                  <StudentFinancialOverview
                    eligibility={eligibility}
                    account={studentAccount}
                    onOpenMakePayment={() => setShowPaymentModal(true)}
                    onRequestAssistance={() => setActiveTab('services')}
                    onRefresh={() => loadFinancialData(studentId)}
                    onViewAllProgrammes={() => setActiveTab('programmes')}
                    onOpenRegistration={() => setActiveTab('academics-registration')}
                  />
                )}

                {/* 1b. Course Registration & Academic Stamp Queue */}
                {activeTab === 'academics-registration' && (
                  <AcademicsRegistrationPage
                    session={session}
                    onOpenMakePayment={() => setShowPaymentModal(true)}
                    onOpenLiveTv={() => {
                      setTvInitialHall('ACADEMICS');
                      setShowTvDisplay(true);
                    }}
                  />
                )}

                {/* 2. Programme Tuition Structures */}
                {activeTab === 'programmes' && (
                  <ProgrammeFeeStructures
                    currentStudentProgramme={eligibility?.programme || session.user.student?.programme}
                  />
                )}

                {/* 3. Payments & Official Receipts */}
                {activeTab === 'payments' && isStudent && (
                  <StudentPaymentsList
                    studentId={studentId}
                    onOpenMakePayment={() => setShowPaymentModal(true)}
                  />
                )}

                {/* 4. Digital Accounts Services */}
                {activeTab === 'services' && isStudent && (
                  <StudentDigitalServices
                    studentId={studentId}
                    onOpenQueue={() => setActiveTab('queue')}
                  />
                )}

                {/* 5. Virtual Queue & Appointments */}
                {activeTab === 'queue' && isStudent && (
                  <VirtualQueueCard
                    studentId={studentId}
                    onOpenTvDisplay={() => setShowTvDisplay(true)}
                  />
                )}

                {/* 6. Payment Verifications */}
                {activeTab === 'verification' && isStaff && <StaffPaymentVerification />}

                {/* 7. Counter Queue Operator Desk */}
                {activeTab === 'queue-desk' && isStaff && (
                  <StaffQueueOperator onOpenTvDisplay={() => setShowTvDisplay(true)} />
                )}

                {/* 8. Service Tickets & Appeals */}
                {activeTab === 'tickets-manage' && isStaff && <StaffTicketsManager />}

                {/* 9. Student Ledgers Search */}
                {activeTab === 'students-lookup' && isStaff && <StudentLedgersLookup />}

                {/* 10. Analytics & Avoided Visits */}
                {activeTab === 'reports' && isSupervisor && <SupervisorReports />}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500 shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Uganda Christian University — Directorate of Finance & Accounts</span>
          <span className="font-mono text-[11px] text-slate-400">CampusQ v2.4 Enterprise System</span>
        </div>
      </footer>

      {/* 5. Payment Submission Modal */}
      {showPaymentModal && studentId && (
        <PaymentSubmissionModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSubmitted={() => {
            loadFinancialData(studentId);
          }}
          studentId={studentId}
        />
      )}

      {/* 6. Public TV Queue Calling Display Modal */}
      {showTvDisplay && (
        <PublicQueueDisplay
          initialHall={tvInitialHall}
          onClose={() => setShowTvDisplay(false)}
        />
      )}
    </div>
  );
}
