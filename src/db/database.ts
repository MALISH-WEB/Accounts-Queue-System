import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { getInitialSeedData } from './seed-data.js';

export interface DatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  run(sql: string, params?: any[]): Promise<{ changes: number; lastInsertId?: number | string }>;
  transaction<T>(fn: (tx: DatabaseAdapter) => Promise<T>): Promise<T>;
}

class SqlJsDatabaseAdapter implements DatabaseAdapter {
  private db: any = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const SQL = await initSqlJs();
      this.db = new SQL.Database();

      // Read schema.sql
      const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
      let schemaSql = fs.readFileSync(schemaPath, 'utf8');

      // Prepare schema for SQLite compatibility while preserving relational semantics
      schemaSql = schemaSql
        .replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/gi, '')
        .replace(/TIMESTAMP WITH TIME ZONE/gi, 'TIMESTAMP')
        .replace(/NUMERIC\(\d+,\s*\d+\)/gi, 'REAL');

      // Execute schema statements
      this.db.run(schemaSql);

      // Read seeds.sql
      const seedsPath = path.join(process.cwd(), 'src', 'db', 'seeds.sql');
      const seedsSql = fs.readFileSync(seedsPath, 'utf8');
      this.db.run(seedsSql);

      // Populate rich domain seed records
      this.populateSeedData();

      console.log('✅ CampusQ Relational Database successfully initialized with UCU Accounts Office schemas and seed records.');
    })();

    return this.initPromise;
  }

  private populateSeedData() {
    const data = getInitialSeedData();

    // Insert users
    for (const u of data.users) {
      this.run(
        `INSERT OR IGNORE INTO users (id, email, password_hash, full_name, phone, role, avatar_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.email, u.password_hash, u.full_name, u.phone, u.role, u.avatar_url, u.created_at, u.updated_at]
      );
      this.run(
        `INSERT OR IGNORE INTO user_roles (id, user_id, role_id, assigned_at) VALUES (?, ?, ?, ?)`,
        [`UR_${u.id}`, u.id, u.role, u.created_at]
      );
    }

    // Insert students
    for (const s of data.students) {
      this.run(
        `INSERT OR IGNORE INTO students (id, user_id, student_number, registration_number, programme, faculty, campus, has_financial_hold, financial_hold_reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.user_id, s.student_number, s.registration_number, s.programme, s.faculty, s.campus, s.has_financial_hold ? 1 : 0, s.financial_hold_reason, s.created_at]
      );

      this.run(
        `INSERT OR IGNORE INTO student_semesters (id, student_id, semester_id, year_of_study, semester_number, is_registered)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`STU_SEM_${s.id}`, s.id, 'SEM_EASTER_2026', 2, 1, 0]
      );
    }

    // Insert accounts staff
    for (const st of data.accountsStaff) {
      this.run(
        `INSERT OR IGNORE INTO accounts_staff (id, user_id, staff_number, title, assigned_counter, is_available_for_queue, max_active_tickets, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [st.id, st.user_id, st.staff_number, st.title, st.assigned_counter, st.is_available_for_queue ? 1 : 0, st.max_active_tickets, st.created_at]
      );
    }

    // Insert financial accounts
    for (const fa of data.financialAccounts) {
      this.run(
        `INSERT OR IGNORE INTO student_financial_accounts (id, student_id, semester_id, assessed_tuition, other_assessed_fees, total_assessed, verified_amount_paid, pending_amount_paid, outstanding_balance, payment_percentage, has_late_charges_assessed, total_late_charges, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fa.id, fa.student_id, fa.semester_id, fa.assessed_tuition, fa.other_assessed_fees, fa.total_assessed, fa.verified_amount_paid, fa.pending_amount_paid, fa.outstanding_balance, fa.payment_percentage, fa.has_late_charges_assessed ? 1 : 0, fa.total_late_charges, fa.updated_at]
      );
    }

    // Insert payments
    for (const p of data.payments) {
      this.run(
        `INSERT OR IGNORE INTO payments (id, student_id, semester_id, transaction_reference, amount, payment_date, payment_method, status, notes, proof_document_url, submitted_at, verified_by, verified_at, rejection_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.student_id, p.semester_id, p.transaction_reference, p.amount, p.payment_date, p.payment_method, p.status, p.notes, p.proof_document_url, p.submitted_at, p.verified_by, p.verified_at, p.rejection_reason]
      );
    }

    // Insert receipts
    for (const r of data.receipts) {
      this.run(
        `INSERT OR IGNORE INTO receipts (id, receipt_number, payment_id, student_id, semester_id, amount, currency, transaction_reference, payment_date, verification_date, verified_by_staff_name, download_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.receipt_number, r.payment_id, r.student_id, r.semester_id, r.amount, r.currency, r.transaction_reference, r.payment_date, r.verification_date, r.verified_by_staff_name, r.download_count, r.created_at]
      );
    }

    // Insert late-payment charges
    for (const l of data.latePaymentCharges) {
      this.run(
        `INSERT OR IGNORE INTO late_payment_charges (id, student_id, semester_id, milestone_id, amount, reason, charge_mode, assessment_date, status, waived_by, waived_at, waiver_reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [l.id, l.student_id, l.semester_id, l.milestone_id, l.amount, l.reason, l.charge_mode, l.assessment_date, l.status, l.waived_by, l.waived_at, l.waiver_reason, l.created_at]
      );
    }

    // Insert tickets
    for (const t of data.tickets) {
      this.run(
        `INSERT OR IGNORE INTO tickets (id, ticket_number, student_id, service_id, category, description, priority, status, assigned_staff_id, queue_id, expected_resolution_time, actual_resolution_time, resolution_summary, is_escalated, escalation_reason, student_feedback_rating, student_feedback_comments, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.ticket_number, t.student_id, t.service_id, t.category, t.description, t.priority, t.status, t.assigned_staff_id, t.queue_id, t.expected_resolution_time, t.actual_resolution_time, t.resolution_summary, t.is_escalated ? 1 : 0, t.escalation_reason, t.student_feedback_rating, t.student_feedback_comments, t.created_at, t.updated_at]
      );

      this.run(
        `INSERT OR IGNORE INTO ticket_status_history (id, ticket_id, from_status, to_status, changed_by_user_id, changed_by_role, notes, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [`TSH_${t.id}`, t.id, 'WAITING', t.status, 'USR_STAFF_1', 'ACCOUNTS_OFFICER', 'Initial status transition', t.created_at]
      );
    }

    // Insert ticket messages (using documents or internal message table)
    this.run(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id VARCHAR(50) PRIMARY KEY,
        ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        sender_user_id VARCHAR(50) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_internal_only BOOLEAN DEFAULT 0,
        attachment_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const m of data.ticketMessages) {
      this.run(
        `INSERT OR IGNORE INTO ticket_messages (id, ticket_id, sender_user_id, sender_name, sender_role, message, is_internal_only, attachment_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.ticket_id, m.sender_user_id, m.sender_name, m.sender_role, m.message, m.is_internal_only ? 1 : 0, m.attachment_url, m.created_at]
      );
    }

    // Insert queue entries
    for (const q of data.queueEntries) {
      this.run(
        `INSERT OR IGNORE INTO queue_entries (id, queue_number, student_id, service_id, ticket_id, priority, status, position, assigned_counter, assigned_staff_id, estimated_wait_minutes, called_at, served_at, completed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.id, q.queue_number, q.student_id, q.service_id, q.ticket_id, q.priority, q.status, q.position, q.assigned_counter, q.assigned_staff_id, q.estimated_wait_minutes, q.called_at, q.served_at, q.completed_at, q.created_at]
      );
    }

    // Insert appointments
    for (const a of data.appointments) {
      this.run(
        `INSERT OR IGNORE INTO appointments (id, appointment_number, student_id, service_id, staff_id, appointment_type, scheduled_date, time_slot, status, meeting_link_or_counter, reason, staff_notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.appointment_number, a.student_id, a.service_id, a.staff_id, a.appointment_type, a.scheduled_date, a.time_slot, a.status, a.meeting_link_or_counter, a.reason, a.staff_notes, a.created_at]
      );
    }

    // Insert notifications
    for (const n of data.notifications) {
      this.run(
        `INSERT OR IGNORE INTO notifications (id, recipient_user_id, type, title, message, is_read, entity_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [n.id, n.recipient_user_id, n.type, n.title, n.message, n.is_read ? 1 : 0, n.entity_id, n.created_at]
      );
    }

    // Insert audit logs
    for (const al of data.auditLogs) {
      this.run(
        `INSERT OR IGNORE INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, old_value, new_value, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [al.id, al.user_id, al.user_role, al.user_name, al.action, al.entity_type, al.entity_id, al.old_value, al.new_value, al.details, al.timestamp]
      );
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.init();
    try {
      const stmt = this.db.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      stmt.free();
      return results;
    } catch (err: any) {
      console.error('SQL Execution error:', err.message, 'SQL:', sql, 'Params:', params);
      throw err;
    }
  }

  async getOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertId?: number | string }> {
    await this.init();
    try {
      this.db.run(sql, params);
      return {
        changes: this.db.getRowsModified(),
      };
    } catch (err: any) {
      console.error('SQL Run error:', err.message, 'SQL:', sql, 'Params:', params);
      throw err;
    }
  }

  async transaction<T>(fn: (tx: DatabaseAdapter) => Promise<T>): Promise<T> {
    await this.init();
    this.db.run('BEGIN TRANSACTION');
    try {
      const result = await fn(this);
      this.db.run('COMMIT');
      return result;
    } catch (err) {
      this.db.run('ROLLBACK');
      throw err;
    }
  }
}

export const db: DatabaseAdapter = new SqlJsDatabaseAdapter();
