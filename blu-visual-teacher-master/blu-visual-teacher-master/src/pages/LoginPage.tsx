import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BluLogo } from '../components/BluMark';
import { Icon } from '../components/Icon';
import { Spinner } from '../components/ui';
import { AuthError, useAuth } from '../lib/auth';

export function LoginPage() {
  const { user, status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Already signed in → straight back to the studio.
  if (status === 'authed' && user) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('That email address does not look right.');
      return;
    }
    setBusy(true);
    try {
      const u = await login(email.trim(), password, remember);
      navigate(from, { replace: true });
      void u;
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Could not sign you in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    setError(null);
    setNotice(null);
    try {
      const msg = await import('../lib/auth').then((m) => m.authService.forgotPassword());
      setNotice(msg || 'Password reset is not configured on this backend.');
    } catch (err) {
      setNotice(
        err instanceof AuthError ? err.message : 'Password reset is not available right now.',
      );
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-card cut-br">
        <div className="auth-brand">
          <BluLogo size={40} />
          <span>Blu Visual Teacher</span>
        </div>

        <h1 className="auth-title">Welcome Back!</h1>
        <p className="auth-sub">Continue your learning journey with AI-powered lessons.</p>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="login-password">
              Password
            </label>
            <div className="auth-input-wrap">
              <input
                id="login-password"
                className="input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
              </button>
            </div>
          </div>

          <div className="auth-row">
            <label className="auth-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button type="button" className="auth-link" onClick={() => void onForgot()}>
              Forgot password?
            </button>
          </div>

          {error && (
            <p className="auth-error" role="alert">
              <Icon name="alert" size={15} /> {error}
            </p>
          )}
          {notice && (
            <p className="auth-notice" role="status">
              <Icon name="info" size={15} /> {notice}
            </p>
          )}

          <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
            {busy ? (
              <>
                <Spinner size={16} /> Signing in…
              </>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button className="btn auth-oauth" type="button" disabled title="OAuth is not configured on this local backend">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M21.35 11.1H12v3.2h5.35c-.25 1.5-1.8 4.4-5.35 4.4a6.7 6.7 0 1 1 0-13.4c1.9 0 3.2.8 3.9 1.5l2.6-2.5A10.4 10.4 0 1 0 12 22.4c6 0 10-4.2 10-10.1 0-.7-.1-1.2-.25-1.3Z" />
          </svg>
          Continue with Google
        </button>
        <p className="auth-oauth-note">Google sign-in becomes available when OAuth is configured on the backend.</p>

        <p className="auth-switch">
          Don’t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
