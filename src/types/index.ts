/**
 * CampusQ — UCU Accounts Office Digital Services & Intelligent Virtual Queue System
 * Core Types, Enums, and Interfaces
 */

// User Roles strictly within Accounts Office domain
export enum UserRole {
  STUDENT = 'STUDENT',
  ACCOUNTS_OFFICER = 'ACCOUNTS_OFFICER',
  SENIOR_ACCOUNTS_OFFICER = 'SENIOR_ACCOUNTS_OFFICER',
  ACCOUNTS_SUPERVISOR = 'ACCOUNTS_SUPERVISOR', // Accounts Manager/Supervisor
}

// Payment Verification Statuses
export enum PaymentStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

// Payment Methods accepted by UCU Accounts
export enum PaymentMethod {
  STANBIC_BANK = 'STANBIC_BANK',
  CENTENARY_BANK = 'CENTENARY_BANK',
  ABSA_BANK = 'ABSA_BANK',
  EQUITY_BANK = 'EQUITY_BANK',
  AIRTEL_MONEY = 'AIRTEL_MONEY',
  MTN_MOBILE_MONEY = 'MTN_MOBILE_MONEY',
  ZEEPAY = 'ZEEPAY',
  BANK_DRAFT = 'BANK_DRAFT',
}

// Late-payment charge modes and statuses
export enum LatePaymentChargeMode {
  ONCE_PER_MILESTONE = 'ONCE_PER_MILESTONE',
  ONCE_PER_SEMESTER = 'ONCE_PER_SEMESTER',
  RECURRING = 'RECURRING',
}

export enum LatePaymentChargeStatus {
  ASSESSED = 'ASSESSED',
  PAID = 'PAID',
  WAIVED = 'WAIVED',
  CANCELLED = 'CANCELLED',
}

// Ticket Status Machine
export enum TicketStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  SERVING = 'SERVING',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_STUDENT = 'PENDING_STUDENT',
  PENDING_STAFF = 'PENDING_STAFF',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum TicketPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Virtual Queue Statuses
export enum QueueStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  SERVING = 'SERVING',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
}

// Appointment Statuses & Types
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  MISSED = 'MISSED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum AppointmentType {
  REMOTE = 'REMOTE',
  PHYSICAL = 'PHYSICAL',
}

// Eligibility Result
export enum EligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  BLOCKED = 'BLOCKED',
}

// Notification Types
export enum NotificationType {
  PAYMENT_SUBMITTED = 'PAYMENT_SUBMITTED',
  PAYMENT_VERIFIED = 'PAYMENT_VERIFIED',
  PAYMENT_REJECTED = 'PAYMENT_REJECTED',
  RECEIPT_GENERATED = 'RECEIPT_GENERATED',
  REGISTRATION_ELIGIBILITY_ACHIEVED = 'REGISTRATION_ELIGIBILITY_ACHIEVED',
  REGISTRATION_ELIGIBILITY_BLOCKED = 'REGISTRATION_ELIGIBILITY_BLOCKED',
  LATE_PAYMENT_CHARGE_ASSESSED = 'LATE_PAYMENT_CHARGE_ASSESSED',
  LATE_PAYMENT_CHARGE_WAIVED = 'LATE_PAYMENT_CHARGE_WAIVED',
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  STAFF_REQUESTED_INFO = 'STAFF_REQUESTED_INFO',
  TICKET_RESOLVED = 'TICKET_RESOLVED',
  QUEUE_JOINED = 'QUEUE_JOINED',
  QUEUE_CALLED = 'QUEUE_CALLED',
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
}

// --- Domain Interfaces ---

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentNumber: string; // e.g. S22B14/001
  registrationNumber: string; // e.g. A92831
  programme: string; // e.g. Bachelor of Science in Information Technology
  faculty: string; // e.g. Faculty of Science & Technology
  campus: string; // Main Campus - Mukono
  hasFinancialHold: boolean;
  financialHoldReason?: string;
}

export interface AccountsStaffProfile {
  id: string;
  userId: string;
  staffNumber: string;
  title: string;
  assignedCounter?: string; // e.g. "Counter 1 - General Enquiries"
  isAvailableForQueue: boolean;
  maxActiveTickets: number;
}

export interface Semester {
  id: string;
  code: string; // e.g. "SEM-1-2025/2026"
  name: string; // "Easter Semester 2026"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  registrationDeadline: string; // One month after commencement
  midSemesterDeadline: string;
  finalPaymentDeadline: string;
}

export interface SemesterPaymentPolicy {
  id: string;
  semesterId: string;
  registrationThresholdPercent: number; // default 45
  midSemesterThresholdPercent: number; // default 75
  finalThresholdPercent: number; // default 100
  latePaymentChargeAmount: number; // default UGX 50,000
  currency: string; // UGX
  chargeMode: LatePaymentChargeMode;
  isActive: boolean;
  updatedBy?: string;
  updatedAt: string;
}

export interface PaymentMilestone {
  id: string;
  policyId: string;
  name: string;
  requiredPercentage: number;
  orderIndex: number;
  deadline: string;
  isActive: boolean;
}

export interface StudentFinancialAccount {
  id: string;
  studentId: string;
  semesterId: string;
  assessedTuition: number; // in UGX
  otherAssessedFees: number; // functional fees, etc.
  totalAssessed: number;
  verifiedAmountPaid: number;
  pendingAmountPaid: number;
  outstandingBalance: number;
  paymentPercentage: number; // calculated solely on verified payments
  hasLateChargesAssessed: boolean;
  totalLateCharges: number;
  updatedAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  semesterId: string;
  transactionReference: string; // e.g. STAN-2026-948271
  amount: number; // UGX
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
  proofDocumentUrl?: string;
  submittedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface LatePaymentCharge {
  id: string;
  studentId: string;
  semesterId: string;
  milestoneId?: string;
  amount: number; // default 50000 UGX
  reason: string;
  chargeMode: LatePaymentChargeMode;
  assessmentDate: string;
  status: LatePaymentChargeStatus;
  waivedBy?: string;
  waivedAt?: string;
  waiverReason?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string; // e.g. UCU-REC-2026-00412
  paymentId: string;
  studentId: string;
  semesterId: string;
  amount: number;
  currency: string;
  transactionReference: string;
  paymentDate: string;
  verificationDate: string;
  verifiedByStaffName: string;
  downloadCount: number;
  createdAt: string;
}

export interface AccountsService {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  requiredInformation: string[];
  requiredDocuments: string[];
  estimatedProcessingTimeMinutes: number;
  isSelfServiceSupported: boolean;
  isRemoteHandlingSupported: boolean;
  isQueueRequired: boolean;
  isAppointmentRequired: boolean;
  isActive: boolean;
  authorizedDestinationRole: UserRole;
  iconName: string;
}

export interface TicketStatusHistory {
  id: string;
  ticketId: string;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  changedByUserId: string;
  changedByRole: UserRole;
  timestamp: string;
  notes?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderUserId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  isInternalOnly: boolean; // only visible to staff
  attachmentUrl?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g. ACC-2026-0015
  studentId: string;
  studentNumber: string;
  studentName: string;
  serviceId: string;
  serviceName: string;
  category: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  queueId?: string;
  expectedResolutionTime?: string;
  actualResolutionTime?: string;
  resolutionSummary?: string;
  isEscalated: boolean;
  escalationReason?: string;
  studentFeedbackRating?: number; // 1 to 5
  studentFeedbackComments?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory?: TicketStatusHistory[];
  messages?: TicketMessage[];
}

export interface VirtualQueueEntry {
  id: string;
  queueNumber: string; // e.g. ACC-Q-2026-0042
  studentId: string;
  studentNumber: string;
  studentName: string;
  serviceId: string;
  serviceName: string;
  ticketId?: string;
  priority: TicketPriority;
  status: QueueStatus;
  position: number;
  assignedCounter?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  estimatedWaitMinutes: number;
  calledAt?: string;
  servedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string; // e.g. ACC-APT-2026-0019
  studentId: string;
  studentNumber: string;
  studentName: string;
  serviceId: string;
  serviceName: string;
  staffId?: string;
  staffName?: string;
  appointmentType: AppointmentType;
  scheduledDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 - 10:30"
  status: AppointmentStatus;
  meetingLinkOrCounter?: string;
  reason: string;
  staffNotes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  entityId?: string; // id of related payment, ticket, appointment, etc.
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userRole: UserRole;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
  timestamp: string;
}

export interface FunctionalFeesBreakdown {
  examinationFee: number;
  technologyIctFee: number;
  libraryFee: number;
  medicalClinicFee: number;
  guildSportsFee: number;
  developmentFundFee: number;
  clinicalLabFee?: number;
}

export interface ProgrammeTuitionStructure {
  id: string;
  code: string;
  name: string;
  faculty: string;
  campus: string;
  tuitionFee: number;
  functionalFees: number;
  functionalFeesBreakdown: FunctionalFeesBreakdown;
  totalAssessed: number;
  policyRegistration45: number;
  policyMidSem75: number;
  policyFinal100: number;
  latePaymentCharge: number;
  description: string;
}

// Calculation and Evaluation Results
export interface FinancialEligibilityResult {
  studentNumber: string;
  studentName: string;
  programme: string;
  semesterCode: string;
  assessedTuition: number;
  verifiedAmountPaid: number;
  currentPercentage: number;
  requiredPercentage: number; // default 45%
  outstandingBalance: number;
  amountNeededForEligibility: number;
  eligibilityStatus: EligibilityStatus;
  hasFinancialHold: boolean;
  financialHoldReason?: string;
  explanation: string;
  programmeFeeStructure?: ProgrammeTuitionStructure;
  milestones: {
    name: string;
    targetPercent: number;
    achieved: boolean;
    deficitAmount: number;
  }[];
}

export interface ReportsSummary {
  financial: {
    totalAssessedTuition: number;
    totalVerifiedPayments: number;
    totalOutstandingBalance: number;
    studentsCountTotal: number;
    studentsBelow45: number;
    studentsAtOrAbove45: number;
    studentsAtOrAbove75: number;
    studentsAt100: number;
    pendingVerificationsCount: number;
    rejectedPaymentsCount: number;
    totalLateChargesAssessed: number;
    totalLateChargesWaived: number;
  };
  service: {
    totalRequests: number;
    requestsByService: { serviceName: string; count: number }[];
    resolvedRequests: number;
    pendingRequests: number;
    escalatedRequests: number;
    averageResolutionHours: number;
    firstContactResolutionRate: number; // percentage
    averageStudentSatisfactionRating: number; // 1 to 5
  };
  queueAndAvoidance: {
    totalQueueEntries: number;
    digitallyCompletedRequests: number;
    remotelyResolvedRequests: number;
    physicalVisitsAvoided: number;
    physicalVisitAvoidanceRate: number; // percentage
    physicalServicesCount: number;
    averageVirtualWaitMinutes: number;
    averagePhysicalWaitMinutes: number;
    queueCompletionRate: number;
    queueAbandonmentRate: number;
  };
}
