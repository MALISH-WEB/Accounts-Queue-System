-- CampusQ — UCU Accounts Office Seed Data (PostgreSQL Format)

-- 1. Roles
INSERT INTO roles (id, name, description) VALUES
('STUDENT', 'Student', 'UCU Student accessing Accounts Office services'),
('ACCOUNTS_OFFICER', 'Accounts Officer', 'Front-desk financial verification and ticket resolution staff'),
('SENIOR_ACCOUNTS_OFFICER', 'Senior Accounts Officer', 'Escalation desk, balance dispute, and fee adjustment reviewer'),
('ACCOUNTS_SUPERVISOR', 'Accounts Supervisor / Manager', 'Head of Accounts Office, policy administration and analytics')
ON CONFLICT (id) DO NOTHING;

-- 2. Service Categories
INSERT INTO service_categories (id, name, description) VALUES
('CAT_CLEARANCE', 'Financial Clearance & Eligibility', 'Tuition assessment, milestones, and registration clearance'),
('CAT_VERIFICATION', 'Payment Verification & Receipts', 'Bank slip, mobile money verification and official receipting'),
('CAT_DISPUTES', 'Inquiries & Disputes', 'Disputed ledger entries, missing payments, and fee adjustments'),
('CAT_SPECIAL_FEES', 'Specialized Payments', 'Retakes, recess semester, graduation and sponsorship accounts'),
('CAT_REMOTE_ASSISTANCE', 'Consultation & Remote Assistance', 'Virtual tickets, officer consultations, and appointments')
ON CONFLICT (id) DO NOTHING;

-- 3. Semesters
INSERT INTO semesters (id, code, name, start_date, end_date, is_current, registration_deadline, mid_semester_deadline, final_payment_deadline) VALUES
('SEM_EASTER_2026', 'SEM-1-2025/2026', 'Easter Semester 2026', '2026-01-15', '2026-05-30', TRUE, '2026-02-15', '2026-03-31', '2026-05-15'),
('SEM_ADVENT_2025', 'SEM-2-2024/2025', 'Advent Semester 2025', '2025-08-20', '2025-12-18', FALSE, '2025-09-20', '2025-10-31', '2025-12-05')
ON CONFLICT (id) DO NOTHING;

-- 4. Semester Payment Policy
INSERT INTO semester_payment_policies (id, semester_id, registration_threshold_percent, mid_semester_threshold_percent, final_threshold_percent, late_payment_charge_amount, currency, charge_mode, is_active) VALUES
('POL_EASTER_2026', 'SEM_EASTER_2026', 45.00, 75.00, 100.00, 50000.00, 'UGX', 'ONCE_PER_MILESTONE', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Payment Milestones
INSERT INTO payment_milestones (id, policy_id, name, required_percentage, order_index, deadline, is_active) VALUES
('MS_REG_2026', 'POL_EASTER_2026', 'Registration Eligibility (45%)', 45.00, 1, '2026-02-15', TRUE),
('MS_MID_2026', 'POL_EASTER_2026', 'Mid-Semester Milestone (75%)', 75.00, 2, '2026-03-31', TRUE),
('MS_FIN_2026', 'POL_EASTER_2026', 'Final Financial Clearance (100%)', 100.00, 3, '2026-05-15', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 6. Counters
INSERT INTO counters (id, name, code, is_active, current_serving_ticket) VALUES
('CTR_1', 'Counter 1 — General Financial Enquiries', 'CTR-01', TRUE, 'ACC-Q-2026-0004'),
('CTR_2', 'Counter 2 — Senior Officer & Disputes', 'CTR-02', TRUE, 'ACC-Q-2026-0005'),
('CTR_3', 'Counter 3 — Sponsored Students & Special Fees', 'CTR-03', TRUE, NULL),
('CTR_4', 'Counter 4 — Clearance & Receipt Issuance', 'CTR-04', TRUE, NULL),
('CTR_5', 'Counter 5 — Academics Office: Registration & Stamping Desk', 'CTR-05', TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

-- 7. Accounts Office Services (All 20 + Academics Office Registration Stamping)
INSERT INTO services (id, code, name, description, category_id, estimated_processing_time_minutes, is_self_service_supported, is_remote_handling_supported, is_queue_required, is_appointment_required, is_active, authorized_destination_role, icon_name) VALUES
('SRV_BAL_INQUIRY', 'SRV-01', 'Balance Inquiry', 'Instant self-service retrieval of current semester fees, verified credits, and remaining balance.', 'CAT_CLEARANCE', 1, TRUE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'CreditCard'),
('SRV_CLEARANCE', 'SRV-02', 'Semester Financial Clearance', 'Verify minimum payment requirements (45% for registration, 100% for exam card) and issue electronic clearance slip.', 'CAT_CLEARANCE', 5, TRUE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'CheckCircle'),
('SRV_PAY_VERIFY', 'SRV-03', 'Payment Verification', 'Submit and review bank deposit slips, Stanbic/Centenary/Absa reference codes, or Airtel/MTN mobile money confirmations.', 'CAT_VERIFICATION', 30, FALSE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'ShieldCheck'),
('SRV_PAY_NOT_REFLECTED', 'SRV-04', 'Payment Not Reflected', 'Investigate payments made over 48 hours ago that have not appeared in your verified student ledger.', 'CAT_DISPUTES', 60, FALSE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'AlertTriangle'),
('SRV_BAL_DISPUTE', 'SRV-05', 'Balance Dispute', 'Formal review of incorrect charges, double assessments, or conflicting ledger totals.', 'CAT_DISPUTES', 120, FALSE, TRUE, FALSE, FALSE, TRUE, 'SENIOR_ACCOUNTS_OFFICER', 'FileSpreadsheet'),
('SRV_RETAKE_PAY', 'SRV-06', 'Retake Payment', 'Calculate and credit examination retake fees per course credit unit into Accounts records.', 'CAT_SPECIAL_FEES', 15, TRUE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'RotateCcw'),
('SRV_RECESS_PAY', 'SRV-07', 'Recess Semester Payment', 'Submit and verify assessed recess semester tuition and workshop facility charges.', 'CAT_SPECIAL_FEES', 20, TRUE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'Calendar'),
('SRV_GRAD_PAY', 'SRV-08', 'Graduation Payment', 'Final audit of gown, graduation handbook, alumni fees, and zero-balance financial clearance certificate.', 'CAT_SPECIAL_FEES', 45, TRUE, TRUE, FALSE, FALSE, TRUE, 'SENIOR_ACCOUNTS_OFFICER', 'GraduationCap'),
('SRV_SPONSORED_STU', 'SRV-09', 'Sponsored Student Financial Service', 'Liaison for Statehouse, District, NGO, MasterCard, or Church of Uganda sponsored student invoicing.', 'CAT_SPECIAL_FEES', 60, FALSE, TRUE, FALSE, FALSE, TRUE, 'SENIOR_ACCOUNTS_OFFICER', 'Briefcase'),
('SRV_RECEIPT_REQ', 'SRV-10', 'Receipt Request', 'Download authenticated UCU Accounts Office digital receipts with unique receipt numbers and QR validation.', 'CAT_VERIFICATION', 1, TRUE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'Receipt'),
('SRV_FIN_CONSULT', 'SRV-11', 'Financial Consultation', 'Scheduled remote or in-person advisory session on payment installments, hardship, and fee restructuring.', 'CAT_REMOTE_ASSISTANCE', 30, FALSE, TRUE, FALSE, TRUE, TRUE, 'ACCOUNTS_SUPERVISOR', 'HelpCircle'),
('SRV_LATE_CHARGE_REV', 'SRV-12', 'Late-Payment Charge Review', 'Appeal assessed UGX 50,000 late payment charges due to verified bank delays, system downtime, or university waiver.', 'CAT_DISPUTES', 60, FALSE, TRUE, FALSE, FALSE, TRUE, 'SENIOR_ACCOUNTS_OFFICER', 'DollarSign'),
('SRV_MILESTONE_TRACK', 'SRV-13', 'Semester Payment Milestone Tracking', 'Visual progress monitoring across 45% (Registration), 75% (Mid-Semester), and 100% (Final Clearance) benchmarks.', 'CAT_CLEARANCE', 1, TRUE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'TrendingUp'),
('SRV_REG_ELIGIBILITY', 'SRV-14', 'Registration Financial Eligibility Check', 'Automated computation verifying whether cumulative verified payments satisfy the statutory 45% threshold.', 'CAT_CLEARANCE', 1, TRUE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'UserCheck'),
('SRV_VIRTUAL_TICKET', 'SRV-15', 'Accounts Virtual Ticket', 'Open a tracked digital enquiry ticket routed intelligently to available Accounts officers without physical queuing.', 'CAT_REMOTE_ASSISTANCE', 45, TRUE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'MessageSquare'),
('SRV_STAFF_ROUTING', 'SRV-16', 'Accounts Staff Routing', 'Intelligent internal dispatch engine matching student request complexity to front-desk, senior, or supervisory staff.', 'CAT_REMOTE_ASSISTANCE', 5, TRUE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_SUPERVISOR', 'GitBranch'),
('SRV_VIRTUAL_QUEUE', 'SRV-17', 'Accounts Virtual Queue', 'Intelligent live queue pass for services requiring physical counter interaction, complete with live SMS/app position calls.', 'CAT_REMOTE_ASSISTANCE', 15, FALSE, FALSE, TRUE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'Users'),
('SRV_APPOINTMENT_BOOK', 'SRV-18', 'Accounts Appointment Booking', 'Reserve dedicated time slots with Accounts Officers for physical counter consultation or remote Google Meet.', 'CAT_REMOTE_ASSISTANCE', 30, FALSE, TRUE, FALSE, TRUE, TRUE, 'ACCOUNTS_OFFICER', 'CalendarCheck'),
('SRV_FIN_NOTIF', 'SRV-19', 'Financial Notifications', 'Proactive alerts for payment verification, receipt generation, eligibility warnings, and deadline countdowns.', 'CAT_CLEARANCE', 1, TRUE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'Bell'),
('SRV_STU_DASHBOARD', 'SRV-20', 'Student Financial Dashboard', 'Comprehensive single-pane financial health view showing assessed tuition, ledger records, milestones, and active requests.', 'CAT_CLEARANCE', 1, TRUE, TRUE, FALSE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'LayoutDashboard'),
('SRV_ACAD_STAMP', 'ACAD-01', 'Academics Office — Course Registration Endorsement & Official Stamp', 'Submit semester course units registration request and join the Academics Office queue for faculty endorsement and official circular university verification stamp.', 'CAT_CLEARANCE', 5, FALSE, TRUE, TRUE, FALSE, TRUE, 'ACCOUNTS_OFFICER', 'Award')
ON CONFLICT (id) DO NOTHING;
