import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BluLogo } from '../components/BluMark';
import { Icon } from '../components/Icon';
import { Spinner } from '../components/ui';
import { AuthError, useAuth } from '../lib/auth';
import { LANGUAGES } from '../lib/languages';

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };

function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: 'Too short' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score: Math.min(s, 4) as Strength['score'], label: labels[Math.min(s, 4)] };
}

export function SignupPage() {
  const { user, status, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [language, setLanguage] = useState('en');
  const [phone, setPhone] = useState('');
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => passwordStrength(password), [password]);

  // Already signed in → straight to the studio.
  if (status === 'authed' && user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password || !confirm) {
      setError('Please fill in your name, email and password.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('That email address does not look right.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!terms) {
      setError('Please accept the terms to create your account.');
      return;
    }
    setBusy(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        language,
        phone: phone.trim() || undefined,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-card auth-card-tall cut-br">
        <div className="auth-brand">
          <BluLogo size={40} />
          <span>Blu Visual Teacher</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Start turning any topic into an animated lesson — free, offline-first.</p>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="su-name">
              Full name
            </label>
            <input
              id="su-name"
              className="input"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="su-email">
              Email
            </label>
            <input
              id="su-email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="su-password">
              Password
            </label>
            <input
              id="su-password"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="su-strength"
            />
            <div className="auth-strength" id="su-strength" aria-live="polite">
              <span className="auth-strength-bars" data-score={strength.score}>
                <i /><i /><i /><i />
              </span>
              <span className="auth-strength-label">{password ? strength.label : '8+ characters'}</span>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="su-confirm">
              Confirm password
            </label>
            <input
              id="su-confirm"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <div className="auth-grid-2">
            <div className="field">
              <label className="field-label" htmlFor="su-language">
                Preferred learning language
              </label>
              <select
                id="su-language"
                className="input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} · {l.native}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="su-phone">
                Phone <span className="auth-optional">(optional)</span>
              </label>
              <input
                id="su-phone"
                className="input"
                type="tel"
                autoComplete="tel"
                placeholder="+91 …"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <label className="auth-check auth-check-terms">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>
              I agree to the <span className="auth-plain-link">Terms &amp; Conditions</span> and{' '}
              <span className="auth-plain-link">Privacy Policy</span>
            </span>
          </label>

          {error && (
            <p className="auth-error" role="alert">
              <Icon name="alert" size={15} /> {error}
            </p>
          )}

          <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
            {busy ? (
              <>
                <Spinner size={16} /> Creating account…
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
