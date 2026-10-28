/**
 * Authentication service + session context.
 *
 * Everything server-facing lives in `authService` below, so swapping in a
 * different backend later only means editing that one object. The session
 * itself is an HttpOnly cookie set by the backend — no token or password is
 * ever stored in JavaScript, localStorage or sessionStorage.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '../components/ui';

export type Role = 'student' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  language: string;
  phone: string | null;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  language: string;
  phone?: string;
}

/** Friendly, non-technical message for any auth failure. */
export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/auth${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new AuthError('Cannot reach the local backend service. Please try again.');
  }
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  // FastAPI validation errors return `detail` as an array — only trust strings,
  // and never show raw backend/stack output to the user.
  const rawDetail =
    payload && typeof payload === 'object' && 'detail' in payload
      ? (payload as { detail: unknown }).detail
      : null;
  const detail = typeof rawDetail === 'string' ? rawDetail : null;
  if (!res.ok) {
    if (res.status === 401) throw new AuthError(detail ?? 'Email or password is incorrect.', 401);
    if (res.status === 409) throw new AuthError(detail ?? 'An account with this email already exists.', 409);
    if (res.status === 422) throw new AuthError(detail ?? 'Please check the fields and try again.', 422);
    if (res.status >= 500) {
      // Never surface raw backend/stack details to the user.
      throw new AuthError(
        res.status === 501
          ? (detail ?? 'That action is not configured on this backend yet.')
          : 'The server had a problem. Please try again in a moment.',
        res.status,
      );
    }
    throw new AuthError(detail ?? 'Something went wrong. Please try again.', res.status);
  }
  return payload as T;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthUser> {
    const out = await call<{ user: AuthUser }>('/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return out.user;
  },
  async login(email: string, password: string, remember: boolean): Promise<AuthUser> {
    const out = await call<{ user: AuthUser }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
    });
    return out.user;
  },
  async logout(): Promise<void> {
    try {
      await call<{ ok: boolean }>('/logout', { method: 'POST' });
    } catch {
      /* the local cookie is cleared below regardless */
    }
  },
  async me(): Promise<AuthUser | null> {
    try {
      const out = await call<{ user: AuthUser }>('/me');
      return out.user;
    } catch (err) {
      if (err instanceof AuthError && (err.status === 401 || err.status === 403)) return null;
      throw err;
    }
  },
  async forgotPassword(): Promise<string> {
    const out = await call<{ detail?: string }>('/forgot-password', { method: 'POST' });
    return String(out?.detail ?? '');
  },
  async updateProfile(language: string): Promise<AuthUser> {
    const out = await call<{ user: AuthUser }>('/me', {
      method: 'PATCH',
      body: JSON.stringify({ language }),
    });
    return out.user;
  },
};

/* -------------------------------------------------------------------------- */
/* Session context                                                            */
/* -------------------------------------------------------------------------- */

type AuthStatus = 'loading' | 'guest' | 'authed';

interface AuthValue {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  login: (email: string, password: string, remember: boolean) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  // Restore the session after a refresh using the HttpOnly cookie.
  useEffect(() => {
    let alive = true;
    authService
      .me()
      .then((u) => {
        if (!alive) return;
        setUser(u);
        setStatus(u ? 'authed' : 'guest');
      })
      .catch(() => {
        if (!alive) return;
        setStatus('guest');
      });
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const u = await authService.login(email, password, remember);
    setUser(u);
    setStatus('authed');
    setError(null);
    return u;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const u = await authService.register(input);
    setUser(u);
    setStatus('authed');
    setError(null);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus('guest');
    setError(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, status, error, login, register, logout, setUser, clearError: () => setError(null) }),
    [user, status, error, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/* -------------------------------------------------------------------------- */
/* Route guards                                                                */
/* -------------------------------------------------------------------------- */

function AuthLoading() {
  return (
    <div className="auth-guard" role="status" aria-live="polite">
      <Spinner size={22} />
      <span>Restoring your session…</span>
    </div>
  );
}

/** Blocks protected pages until a session exists; otherwise redirects to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <AuthLoading />;
  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

/** Blocks admin-only pages from non-admin accounts. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  if (status === 'loading') return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
