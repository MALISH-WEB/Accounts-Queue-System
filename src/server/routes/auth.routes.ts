import { Router } from 'express';
import { db } from '../../db/database.js';
import { generateToken, comparePassword, authenticate, AuthenticatedRequest } from '../auth.js';
import { UserRole } from '../../types/index.js';

const router = Router();

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'University email/ID and password are required' });
    }

    const trimmedIdentifier = email.trim();
    let user = await db.getOne<any>(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [trimmedIdentifier]);
    
    // If not found by email, check if identifier is a student number or registration number
    if (!user) {
      const studentMatch = await db.getOne<any>(
        `SELECT user_id FROM students WHERE LOWER(student_number) = LOWER(?) OR LOWER(registration_number) = LOWER(?)`,
        [trimmedIdentifier, trimmedIdentifier]
      );
      if (studentMatch) {
        user = await db.getOne<any>(`SELECT * FROM users WHERE id = ?`, [studentMatch.user_id]);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid institutional credentials. Please check your email or registration number.' });
    }

    const isValid = comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password. Please verify your credentials and try again.' });
    }

    let studentProfile: any = null;
    let staffProfile: any = null;

    if (user.role === UserRole.STUDENT) {
      studentProfile = await db.getOne<any>(`SELECT * FROM students WHERE user_id = ?`, [user.id]);
    } else {
      staffProfile = await db.getOne<any>(`SELECT * FROM accounts_staff WHERE user_id = ?`, [user.id]);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role as UserRole,
      studentId: studentProfile?.id,
      staffId: staffProfile?.id,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        student: studentProfile,
        staff: staffProfile,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication service error' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await db.getOne<any>(`SELECT id, email, full_name, phone, role, avatar_url, created_at FROM users WHERE id = ?`, [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let studentProfile: any = null;
    let staffProfile: any = null;

    if (user.role === UserRole.STUDENT) {
      studentProfile = await db.getOne<any>(`SELECT * FROM students WHERE user_id = ?`, [user.id]);
    } else {
      staffProfile = await db.getOne<any>(`SELECT * FROM accounts_staff WHERE user_id = ?`, [user.id]);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        student: studentProfile,
        staff: staffProfile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

/**
 * GET /api/auth/demo-users
 * Returns list of demo accounts for quick role-switching in UI
 */
router.get('/demo-users', async (_req, res) => {
  try {
    const demoAccounts = await db.query<any>(
      `SELECT u.id, u.email, u.full_name, u.role, u.avatar_url,
              s.id as student_id, s.student_number, s.programme,
              st.id as staff_id, st.title as staff_title, st.assigned_counter
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN accounts_staff st ON u.id = st.user_id
       ORDER BY 
         CASE u.role 
           WHEN 'STUDENT' THEN 1 
           WHEN 'ACCOUNTS_OFFICER' THEN 2 
           WHEN 'SENIOR_ACCOUNTS_OFFICER' THEN 3 
           WHEN 'ACCOUNTS_SUPERVISOR' THEN 4 
         END, u.full_name ASC`
    );
    res.json(demoAccounts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load demo accounts' });
  }
});

export default router;
