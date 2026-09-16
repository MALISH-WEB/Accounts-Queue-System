import { Router, Request, Response } from 'express';
import { db } from '../../db/database.js';
import { QueueService } from '../../services/queue-service.js';
import { EligibilityEngine } from '../../services/eligibility-engine.js';
import { getCurriculumForProgramme } from '../../data/curriculum-courses.js';

const router = Router();

// 1. Get student's current registration status and active queue
router.get('/my-registration', async (req: Request, res: Response) => {
  try {
    const studentId = (req.query.studentId as string) || 'STU_1';
    const semesterId = (req.query.semesterId as string) || 'SEM_EASTER_2026';

    // Fetch existing course registration request
    const registration = await db.getOne<any>(
      `SELECT cr.*, u.full_name as student_name, s.student_number, s.registration_number, s.programme, s.faculty, s.campus
       FROM course_registration_requests cr
       JOIN students s ON cr.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE cr.student_id = ? AND cr.semester_id = ?
       ORDER BY cr.created_at DESC LIMIT 1`,
      [studentId, semesterId]
    );

    // Fetch student's financial eligibility
    const eligibility = await EligibilityEngine.evaluateStudent(studentId, semesterId);

    // Fetch any active queue entry in Academics Office or generally
    const activeQueueEntry = await db.getOne<any>(
      `SELECT qe.*, srv.name as service_name, srv.code as service_code
       FROM queue_entries qe
       LEFT JOIN services srv ON qe.service_id = srv.id
       WHERE qe.student_id = ? AND qe.status IN ('WAITING', 'CALLED', 'SERVING')
       ORDER BY qe.created_at DESC LIMIT 1`,
      [studentId]
    );

    let parsedCourseUnits: any[] = [];
    if (registration && registration.course_units) {
      try {
        parsedCourseUnits = JSON.parse(registration.course_units);
      } catch {
        parsedCourseUnits = [];
      }
    }

    res.json({
      registration: registration
        ? {
            ...registration,
            course_units: parsedCourseUnits,
          }
        : null,
      activeQueueEntry,
      eligibility,
    });
  } catch (error: any) {
    console.error('Failed to retrieve student course registration:', error);
    res.status(500).json({ error: error.message || 'Internal error retrieving registration' });
  }
});

// 2. Get standard curriculum course units for student's programme
router.get('/curriculum', async (req: Request, res: Response) => {
  try {
    const programme = (req.query.programme as string) || 'Bachelor of Science in Information Technology';
    const curriculum = getCurriculumForProgramme(programme);
    res.json(curriculum);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Submit Course Registration Request & Join Academics Office Queue for Stamp
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const {
      studentId = 'STU_1',
      semesterId = 'SEM_EASTER_2026',
      courseUnits = [],
      specialNotes = '',
      autoJoinQueue = true,
    } = req.body;

    if (!Array.isArray(courseUnits) || courseUnits.length === 0) {
      return res.status(400).json({ error: 'Please select at least one course unit for registration.' });
    }

    // Verify student
    const student = await db.getOne<any>(
      `SELECT s.*, u.full_name, u.email 
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [studentId]
    );
    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    // Check financial eligibility
    const eligibility = await EligibilityEngine.evaluateStudent(studentId, semesterId);
    const clearancePercent = eligibility?.currentPercentage || 0;
    const isCleared45 = clearancePercent >= 45;

    // Check if registration already exists for this semester
    const existing = await db.getOne<any>(
      `SELECT * FROM course_registration_requests WHERE student_id = ? AND semester_id = ?`,
      [studentId, semesterId]
    );

    const totalCredits = courseUnits.reduce((acc: number, c: any) => acc + (Number(c.creditUnits) || 0), 0);
    const courseUnitsJson = JSON.stringify(courseUnits);

    let registrationId: string;
    let registrationCode: string;

    if (existing) {
      // If already stamped, prevent re-submission unless allowed
      if (existing.status === 'STAMPED') {
        return res.status(400).json({
          error: 'Your course registration is already officially stamped and finalized. Contact the Academic Registrar to request amendments.',
          registration: existing,
        });
      }

      registrationId = existing.id;
      registrationCode = existing.registration_code;

      await db.run(
        `UPDATE course_registration_requests 
         SET course_units = ?, total_credit_units = ?, financial_clearance_percent = ?, 
             financial_status = ?, special_notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          courseUnitsJson,
          totalCredits,
          clearancePercent,
          isCleared45 ? 'CLEARED_45' : 'UNDER_45_PERCENT',
          specialNotes,
          registrationId,
        ]
      );
    } else {
      registrationId = `REG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const regSeq = Math.floor(1000 + Math.random() * 9000);
      registrationCode = `UCU-REG-2026-${regSeq}`;

      await db.run(
        `INSERT INTO course_registration_requests (
          id, registration_code, student_id, semester_id, academic_year, programme_code,
          year_of_study, semester_number, course_units, total_credit_units,
          financial_clearance_percent, financial_status, special_notes, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, '2025/2026', ?, 2, 1, ?, ?, ?, ?, ?, 'PENDING_ACADEMIC_STAMP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          registrationId,
          registrationCode,
          studentId,
          semesterId,
          student.programme || 'BSIT',
          courseUnitsJson,
          totalCredits,
          clearancePercent,
          isCleared45 ? 'CLEARED_45' : 'UNDER_45_PERCENT',
          specialNotes,
        ]
      );
    }

    // Auto-join queue in Academics Office for stamp if requested
    let queueEntry: any = null;
    if (autoJoinQueue) {
      try {
        // Check if student already has active queue ticket
        const activeQueue = await db.getOne<any>(
          `SELECT * FROM queue_entries WHERE student_id = ? AND status IN ('WAITING', 'CALLED', 'SERVING')`,
          [studentId]
        );

        if (activeQueue) {
          queueEntry = activeQueue;
          await db.run(
            `UPDATE course_registration_requests SET queue_entry_id = ? WHERE id = ?`,
            [activeQueue.id, registrationId]
          );
        } else {
          // Join Academics Office Stamp service queue
          queueEntry = await QueueService.joinQueue(studentId, 'SRV_ACAD_STAMP', undefined, 'STANDARD');
          await db.run(
            `UPDATE course_registration_requests SET queue_entry_id = ? WHERE id = ?`,
            [queueEntry.id, registrationId]
          );
        }
      } catch (qErr: any) {
        console.warn('Queue auto-join notice:', qErr.message);
      }
    }

    // Add notification
    await db.run(
      `INSERT INTO notifications (id, recipient_user_id, title, message, type, is_read, created_at)
       VALUES (?, ?, 'Course Registration Request Dispatched', ?, 'ACADEMIC', FALSE, CURRENT_TIMESTAMP)`,
      [
        `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        student.user_id || 'USR_STU_1',
        queueEntry
          ? `Your course registration request (${registrationCode}) is submitted. You have joined the Academics Office stamping queue (Ticket: ${queueEntry.queue_number}).`
          : `Your course registration request (${registrationCode}) has been submitted for Academics Office review.`,
      ]
    );

    // Audit log
    await db.run(
      `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, new_value)
       VALUES (?, ?, 'STUDENT', ?, 'SUBMIT_COURSE_REGISTRATION', 'COURSE_REGISTRATION', ?, ?)`,
      [
        `AUD_${Date.now()}`,
        student.user_id || 'USR_STU_1',
        student.full_name,
        registrationId,
        `Submitted ${courseUnits.length} course units (${totalCredits} CU). Queued: ${Boolean(queueEntry)}`,
      ]
    );

    // Retrieve saved record
    const updated = await db.getOne<any>(
      `SELECT cr.*, u.full_name as student_name, s.student_number, s.registration_number, s.programme, s.faculty
       FROM course_registration_requests cr
       JOIN students s ON cr.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE cr.id = ?`,
      [registrationId]
    );

    res.status(201).json({
      success: true,
      message: 'Course registration request submitted and queued for Academics Office stamping.',
      registration: {
        ...updated,
        course_units: courseUnits,
      },
      queueEntry,
    });
  } catch (error: any) {
    console.error('Error submitting course registration:', error);
    res.status(500).json({ error: error.message || 'Failed to submit course registration' });
  }
});

// 4. Student re-joins or manually joins the Academics Office Stamp queue
router.post('/:id/join-stamp-queue', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const registration = await db.getOne<any>(`SELECT * FROM course_registration_requests WHERE id = ?`, [id]);

    if (!registration) {
      return res.status(404).json({ error: 'Registration record not found.' });
    }

    if (registration.status === 'STAMPED') {
      return res.status(400).json({ error: 'This registration is already officially stamped.' });
    }

    const queueEntry = await QueueService.joinQueue(
      registration.student_id,
      'SRV_ACAD_STAMP',
      undefined,
      'STANDARD'
    );

    await db.run(
      `UPDATE course_registration_requests SET queue_entry_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [queueEntry.id, id]
    );

    res.json({
      success: true,
      message: 'Successfully joined Academics Office stamping queue.',
      queueEntry,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 5. Staff: List all course registration requests
router.get('/', async (req: Request, res: Response) => {
  try {
    const statusFilter = req.query.status as string;
    let query = `
      SELECT cr.*, u.full_name as student_name, s.student_number, s.registration_number, s.programme, s.faculty,
             qe.queue_number, qe.status as queue_status, qe.assigned_counter
      FROM course_registration_requests cr
      JOIN students s ON cr.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN queue_entries qe ON cr.queue_entry_id = qe.id
    `;
    const params: any[] = [];

    if (statusFilter) {
      query += ` WHERE cr.status = ?`;
      params.push(statusFilter);
    }

    query += ` ORDER BY cr.created_at DESC`;

    const records = await db.query<any>(query, params);
    const parsed = records.map((r) => {
      let cu = [];
      try {
        cu = JSON.parse(r.course_units);
      } catch {
        cu = [];
      }
      return { ...r, course_units: cu };
    });

    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Staff / Academics Desk: Endorse & Affix Official University Stamp
router.post('/:id/stamp', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      staffId = 'USR_STAFF_1',
      staffName = 'Academic Registrar Desk Officer',
    } = req.body;

    const registration = await db.getOne<any>(
      `SELECT cr.*, u.full_name, s.student_number, s.user_id, s.programme
       FROM course_registration_requests cr
       JOIN students s ON cr.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE cr.id = ?`,
      [id]
    );

    if (!registration) {
      return res.status(404).json({ error: 'Registration request not found.' });
    }

    if (registration.status === 'STAMPED') {
      return res.status(400).json({ error: 'This registration has already been stamped.' });
    }

    // Generate authoritative seal number
    const sealSeq = Math.floor(100000 + Math.random() * 900000);
    const stampSealNumber = `UCU-AR-EASTER2026-${sealSeq}`;
    const stampQrHash = `https://verify.ucu.ac.ug/stamp/${stampSealNumber}`;

    await db.transaction(async (tx) => {
      // 1. Update registration record
      await tx.run(
        `UPDATE course_registration_requests 
         SET status = 'STAMPED', stamped_by_user_id = ?, stamped_by_name = ?,
             stamped_at = CURRENT_TIMESTAMP, stamp_seal_number = ?, stamp_qr_hash = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [staffId, staffName, stampSealNumber, stampQrHash, id]
      );

      // 2. Mark student as officially registered for the semester in student_semesters
      await tx.run(
        `UPDATE student_semesters 
         SET is_registered = 1, registered_at = CURRENT_TIMESTAMP
         WHERE student_id = ? AND semester_id = ?`,
        [registration.student_id, registration.semester_id]
      );

      // 3. If there is a linked queue entry, mark it completed
      if (registration.queue_entry_id) {
        await tx.run(
          `UPDATE queue_entries 
           SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP,
               assigned_counter = COALESCE(assigned_counter, 'Counter 5 — Academics Office: Registration & Stamping Desk')
           WHERE id = ?`,
          [registration.queue_entry_id]
        );
      } else {
        // Also check if student has any active queue entry for SRV_ACAD_STAMP
        await tx.run(
          `UPDATE queue_entries 
           SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP,
               assigned_counter = COALESCE(assigned_counter, 'Counter 5 — Academics Office: Registration & Stamping Desk')
           WHERE student_id = ? AND service_id = 'SRV_ACAD_STAMP' AND status IN ('WAITING', 'CALLED', 'SERVING')`,
          [registration.student_id]
        );
      }

      // 4. Send notification to student
      await tx.run(
        `INSERT INTO notifications (id, recipient_user_id, title, message, type, is_read, created_at)
         VALUES (?, ?, 'Registration Officially Stamped & Approved', ?, 'ACADEMIC', FALSE, CURRENT_TIMESTAMP)`,
        [
          `NOTIF_${Date.now()}`,
          registration.user_id || 'USR_STU_1',
          `Your Easter Semester 2026 course registration has been officially endorsed and stamped by the Academics Office (Seal: ${stampSealNumber}).`,
        ]
      );

      // 5. System audit log
      await tx.run(
        `INSERT INTO audit_logs (id, user_id, user_role, user_name, action, entity_type, entity_id, new_value)
         VALUES (?, ?, 'STAFF', ?, 'STAMP_COURSE_REGISTRATION', 'COURSE_REGISTRATION', ?, ?)`,
        [
          `AUD_${Date.now()}`,
          staffId,
          staffName,
          id,
          `Affixed official seal ${stampSealNumber} for student ${registration.full_name} (${registration.student_number})`,
        ]
      );
    });

    const updated = await db.getOne<any>(
      `SELECT cr.*, u.full_name as student_name, s.student_number, s.registration_number, s.programme, s.faculty
       FROM course_registration_requests cr
       JOIN students s ON cr.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE cr.id = ?`,
      [id]
    );

    let cu = [];
    try {
      cu = JSON.parse(updated.course_units);
    } catch {
      cu = [];
    }

    res.json({
      success: true,
      message: 'Course registration successfully stamped with official university seal.',
      registration: {
        ...updated,
        course_units: cu,
      },
    });
  } catch (error: any) {
    console.error('Failed to stamp course registration:', error);
    res.status(500).json({ error: error.message || 'Failed to stamp registration' });
  }
});

export default router;
