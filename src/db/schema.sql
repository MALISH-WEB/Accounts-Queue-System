-- CampusQ — UCU Accounts Office Digital Services & Intelligent Virtual Queue System
-- PostgreSQL Relational Database Schema

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL REFERENCES roles(id),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Roles Mapping (Supports RBAC extensibility)
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    student_number VARCHAR(50) NOT NULL UNIQUE,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    programme VARCHAR(255) NOT NULL,
    faculty VARCHAR(255) NOT NULL,
    campus VARCHAR(100) DEFAULT 'Main Campus - Mukono',
    has_financial_hold BOOLEAN DEFAULT FALSE,
    financial_hold_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Accounts Staff Table (Only Accounts Office hierarchy)
CREATE TABLE IF NOT EXISTS accounts_staff (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    staff_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    assigned_counter VARCHAR(100),
    is_available_for_queue BOOLEAN DEFAULT TRUE,
    max_active_tickets INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Counters Table (Accounts Office physical/virtual counters)
CREATE TABLE IF NOT EXISTS counters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    staff_id VARCHAR(50) REFERENCES accounts_staff(id),
    is_active BOOLEAN DEFAULT TRUE,
    current_serving_ticket VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Semesters Table
CREATE TABLE IF NOT EXISTS semesters (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    registration_deadline DATE NOT NULL,
    mid_semester_deadline DATE NOT NULL,
    final_payment_deadline DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Student Semesters
CREATE TABLE IF NOT EXISTS student_semesters (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_id VARCHAR(50) NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    year_of_study INTEGER NOT NULL DEFAULT 1,
    semester_number INTEGER NOT NULL DEFAULT 1,
    is_registered BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_student_semester UNIQUE (student_id, semester_id)
);

-- 9. Service Categories
CREATE TABLE IF NOT EXISTS service_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Services Table (Restricted strictly to Accounts Office)
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id VARCHAR(50) REFERENCES service_categories(id),
    estimated_processing_time_minutes INTEGER DEFAULT 30,
    is_self_service_supported BOOLEAN DEFAULT TRUE,
    is_remote_handling_supported BOOLEAN DEFAULT TRUE,
    is_queue_required BOOLEAN DEFAULT FALSE,
    is_appointment_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    authorized_destination_role VARCHAR(50) NOT NULL REFERENCES roles(id),
    icon_name VARCHAR(50) DEFAULT 'FileText',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Service Requirements
CREATE TABLE IF NOT EXISTS service_requirements (
    id VARCHAR(50) PRIMARY KEY,
    service_id VARCHAR(50) NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    requirement_type VARCHAR(50) NOT NULL, -- 'INFORMATION' or 'DOCUMENT'
    title VARCHAR(200) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    description TEXT
);

-- 12. Service Workflows
CREATE TABLE IF NOT EXISTS service_workflows (
    id VARCHAR(50) PRIMARY KEY,
    service_id VARCHAR(50) NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    handler_type VARCHAR(50) NOT NULL, -- 'AUTOMATED', 'REMOTE_STAFF', 'VIRTUAL_QUEUE', 'APPOINTMENT'
    description TEXT
);

-- 13. Semester Payment Policies
CREATE TABLE IF NOT EXISTS semester_payment_policies (
    id VARCHAR(50) PRIMARY KEY,
    semester_id VARCHAR(50) NOT NULL UNIQUE REFERENCES semesters(id) ON DELETE CASCADE,
    registration_threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 45.00 CHECK (registration_threshold_percent >= 0 AND registration_threshold_percent <= 100),
    mid_semester_threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 75.00 CHECK (mid_semester_threshold_percent >= 0 AND mid_semester_threshold_percent <= 100),
    final_threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 100.00 CHECK (final_threshold_percent >= 0 AND final_threshold_percent <= 100),
    late_payment_charge_amount NUMERIC(12,2) NOT NULL DEFAULT 50000.00 CHECK (late_payment_charge_amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'UGX',
    charge_mode VARCHAR(50) NOT NULL DEFAULT 'ONCE_PER_MILESTONE',
    is_active BOOLEAN DEFAULT TRUE,
    updated_by VARCHAR(50) REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Payment Milestones
CREATE TABLE IF NOT EXISTS payment_milestones (
    id VARCHAR(50) PRIMARY KEY,
    policy_id VARCHAR(50) NOT NULL REFERENCES semester_payment_policies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    required_percentage NUMERIC(5,2) NOT NULL CHECK (required_percentage >= 0 AND required_percentage <= 100),
    order_index INTEGER NOT NULL,
    deadline DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 15. Student Financial Accounts
CREATE TABLE IF NOT EXISTS student_financial_accounts (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_id VARCHAR(50) NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    assessed_tuition NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (assessed_tuition >= 0),
    other_assessed_fees NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (other_assessed_fees >= 0),
    total_assessed NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_assessed >= 0),
    verified_amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (verified_amount_paid >= 0),
    pending_amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (pending_amount_paid >= 0),
    outstanding_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (payment_percentage >= 0 AND payment_percentage <= 100),
    has_late_charges_assessed BOOLEAN DEFAULT FALSE,
    total_late_charges NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_financial_account UNIQUE (student_id, semester_id)
);

-- 16. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    semester_id VARCHAR(50) NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    notes TEXT,
    proof_document_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_by VARCHAR(50) REFERENCES accounts_staff(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT
);

-- 17. Payment Verifications (Audit & verification history)
CREATE TABLE IF NOT EXISTS payment_verifications (
    id VARCHAR(50) PRIMARY KEY,
    payment_id VARCHAR(50) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    staff_id VARCHAR(50) NOT NULL REFERENCES accounts_staff(id),
    action VARCHAR(50) NOT NULL, -- 'VERIFIED', 'REJECTED'
    reason TEXT,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Late-Payment Charges Table
CREATE TABLE IF NOT EXISTS late_payment_charges (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_id VARCHAR(50) NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    milestone_id VARCHAR(50) REFERENCES payment_milestones(id),
    amount NUMERIC(12,2) NOT NULL DEFAULT 50000.00 CHECK (amount >= 0),
    reason TEXT NOT NULL,
    charge_mode VARCHAR(50) NOT NULL DEFAULT 'ONCE_PER_MILESTONE',
    assessment_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ASSESSED',
    waived_by VARCHAR(50) REFERENCES users(id),
    waived_at TIMESTAMP WITH TIME ZONE,
    waiver_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_late_charge_prevent_duplicate UNIQUE (student_id, semester_id, milestone_id, charge_mode)
);

-- 19. Receipts Table
CREATE TABLE IF NOT EXISTS receipts (
    id VARCHAR(50) PRIMARY KEY,
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    payment_id VARCHAR(50) NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    semester_id VARCHAR(50) NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'UGX',
    transaction_reference VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL,
    verification_date TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_by_staff_name VARCHAR(200) NOT NULL,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Queues Table
CREATE TABLE IF NOT EXISTS queues (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    average_service_time_minutes INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(50) PRIMARY KEY,
    ticket_number VARCHAR(100) NOT NULL UNIQUE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    service_id VARCHAR(50) NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING',
    assigned_staff_id VARCHAR(50) REFERENCES accounts_staff(id),
    queue_id VARCHAR(50) REFERENCES queues(id),
    expected_resolution_time TIMESTAMP WITH TIME ZONE,
    actual_resolution_time TIMESTAMP WITH TIME ZONE,
    resolution_summary TEXT,
    is_escalated BOOLEAN DEFAULT FALSE,
    escalation_reason TEXT,
    student_feedback_rating INTEGER CHECK (student_feedback_rating >= 1 AND student_feedback_rating <= 5),
    student_feedback_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. Ticket Status History
CREATE TABLE IF NOT EXISTS ticket_status_history (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    changed_by_user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    changed_by_role VARCHAR(50) NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. Ticket Assignments
CREATE TABLE IF NOT EXISTS ticket_assignments (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    staff_id VARCHAR(50) NOT NULL REFERENCES accounts_staff(id),
    assigned_by VARCHAR(50) NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- 24. Queue Entries
CREATE TABLE IF NOT EXISTS queue_entries (
    id VARCHAR(50) PRIMARY KEY,
    queue_number VARCHAR(100) NOT NULL UNIQUE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    service_id VARCHAR(50) NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    ticket_id VARCHAR(50) REFERENCES tickets(id),
    priority VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING',
    position INTEGER NOT NULL,
    assigned_counter VARCHAR(100),
    assigned_staff_id VARCHAR(50) REFERENCES accounts_staff(id),
    estimated_wait_minutes INTEGER DEFAULT 15,
    called_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 25. Service Requests (General request log)
CREATE TABLE IF NOT EXISTS service_requests (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    service_id VARCHAR(50) NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    resolution_type VARCHAR(50) NOT NULL, -- 'DIGITAL_SELF_SERVICE', 'REMOTE_STAFF', 'VIRTUAL_QUEUE', 'PHYSICAL_VISIT'
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 26. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    ticket_id VARCHAR(50) REFERENCES tickets(id) ON DELETE CASCADE,
    payment_id VARCHAR(50) REFERENCES payments(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 27. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    recipient_user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    entity_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 28. Consultations Table (Specialized financial consultations)
CREATE TABLE IF NOT EXISTS consultations (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    staff_id VARCHAR(50) REFERENCES accounts_staff(id),
    topic VARCHAR(200) NOT NULL,
    notes TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 29. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    appointment_number VARCHAR(100) NOT NULL UNIQUE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    service_id VARCHAR(50) NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    staff_id VARCHAR(50) REFERENCES accounts_staff(id),
    appointment_type VARCHAR(50) NOT NULL DEFAULT 'REMOTE', -- 'REMOTE' or 'PHYSICAL'
    scheduled_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    meeting_link_or_counter VARCHAR(255),
    reason TEXT NOT NULL,
    staff_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 30. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    service_id VARCHAR(50) REFERENCES services(id),
    ticket_id VARCHAR(50) REFERENCES tickets(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 31. Audit Logs Table (Immutable system audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    user_role VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 32. Course Registration Requests (Academic Office Semester Registration & Official Stamping)
CREATE TABLE IF NOT EXISTS course_registration_requests (
    id VARCHAR(50) PRIMARY KEY,
    registration_code VARCHAR(50) NOT NULL UNIQUE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_id VARCHAR(50) NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) NOT NULL DEFAULT '2025/2026',
    programme_code VARCHAR(50) NOT NULL,
    year_of_study INTEGER NOT NULL DEFAULT 2,
    semester_number INTEGER NOT NULL DEFAULT 1,
    course_units TEXT NOT NULL,
    total_credit_units INTEGER NOT NULL DEFAULT 21,
    financial_clearance_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    financial_status VARCHAR(50) NOT NULL DEFAULT 'CLEARED_45',
    special_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_ACADEMIC_STAMP',
    queue_entry_id VARCHAR(50) REFERENCES queue_entries(id),
    stamped_by_user_id VARCHAR(50) REFERENCES users(id),
    stamped_by_name VARCHAR(150),
    stamped_at TIMESTAMP WITH TIME ZONE,
    stamp_seal_number VARCHAR(100),
    stamp_qr_hash VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --- INDEXES FOR PERFORMANCE AND DATA ISOLATION ---
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_student_number ON students(student_number);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_ref ON payments(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_financial_account_student ON student_financial_accounts(student_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_tickets_student_id ON tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_staff ON tickets(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_student ON queue_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_appointments_student_date ON appointments(student_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_course_reg_student ON course_registration_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_course_reg_status ON course_registration_requests(status);
