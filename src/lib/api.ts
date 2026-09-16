/**
 * CampusQ — Frontend API Client
 * Centralized API requests with automatic JWT token attachment and error handling.
 */

const API_BASE = '/api';

export interface UserSession {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
    student?: any;
    staff?: any;
  };
}

let currentSession: UserSession | null = null;

export function setSession(session: UserSession | null) {
  currentSession = session;
  if (session) {
    localStorage.setItem('campusq_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('campusq_session');
  }
}

export function getSession(): UserSession | null {
  if (currentSession) return currentSession;
  try {
    const saved = localStorage.getItem('campusq_session');
    if (saved) {
      currentSession = JSON.parse(saved);
      return currentSession;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = getSession();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}
