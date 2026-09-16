import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../auth.js';
import { AppointmentService } from '../../services/appointment-service.js';
import { UserRole } from '../../types/index.js';

const router = Router();

router.get('/slots', authenticate, async (req, res) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const staffId = req.query.staffId as string;
    const slots = await AppointmentService.getAvailableSlots(date, staffId);
    res.json(slots);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve available slots' });
  }
});

router.post('/book', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, serviceId, staffId, appointmentType, scheduledDate, timeSlot, reason } = req.body;

    let targetStudentId = studentId;
    if (req.user!.role === UserRole.STUDENT) {
      targetStudentId = req.user!.studentId;
    }

    if (!targetStudentId) {
      return res.status(400).json({ error: 'Valid student ID is required' });
    }

    const appointment = await AppointmentService.bookAppointment(
      {
        studentId: targetStudentId,
        serviceId,
        staffId,
        appointmentType,
        scheduledDate,
        timeSlot,
        reason,
      },
      req.user!.id
    );

    res.status(201).json(appointment);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to book appointment' });
  }
});

router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const appointments = await AppointmentService.listAppointments(req.user!.id, req.user!.role);
    res.json(appointments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
});

router.post('/:id/cancel', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await AppointmentService.cancelAppointment(req.params.id, req.user!.id, req.user!.role);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to cancel appointment' });
  }
});

export default router;
