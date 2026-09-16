/**
 * CampusQ — UCU Accounts Office Authentication & Authorization Middleware
 * JWT-based authentication, bcrypt hashing, and role-based access control.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/index.js';
import { db } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ucu-accounts-office-campusq-jwt-secret-key-2026';

export interface AuthUserPayload {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  studentId?: string;
  staffId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch (err) {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/**
 * Express middleware to authenticate JWT token
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Token is invalid or expired' });
  }

  // Attach studentId or staffId if not already present
  if (decoded.role === UserRole.STUDENT && !decoded.studentId) {
    const s = await db.getOne<any>(`SELECT id FROM students WHERE user_id = ?`, [decoded.id]);
    if (s) decoded.studentId = s.id;
  } else if (decoded.role !== UserRole.STUDENT && !decoded.staffId) {
    const st = await db.getOne<any>(`SELECT id FROM accounts_staff WHERE user_id = ?`, [decoded.id]);
    if (st) decoded.staffId = st.id;
  }

  req.user = decoded;
  next();
}

/**
 * Middleware to enforce role-based access control
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to authorized Accounts roles [${allowedRoles.join(', ')}]. Your current role is ${req.user.role}.`,
      });
    }

    next();
  };
}

export const requireStudent = requireRole(UserRole.STUDENT);
export const requireAccountsStaff = requireRole(
  UserRole.ACCOUNTS_OFFICER,
  UserRole.SENIOR_ACCOUNTS_OFFICER,
  UserRole.ACCOUNTS_SUPERVISOR
);
export const requireSeniorStaff = requireRole(
  UserRole.SENIOR_ACCOUNTS_OFFICER,
  UserRole.ACCOUNTS_SUPERVISOR
);
export const requireSupervisor = requireRole(UserRole.ACCOUNTS_SUPERVISOR);
