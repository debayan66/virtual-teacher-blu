import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Spinner, StateBlock } from '../components/ui';
import { AuthError, useAuth } from '../lib/auth';
import { getLanguage } from '../lib/languages';

/**
 * One account page with three anchored sections — Profile, Learning progress
 * and Settings — so the user menu stays honest without inventing new areas.
 */
export function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Support deep links from the user menu (/profile#progress, #settings).
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  async function saveLanguage(language: string) {
    if (!user || language === user.language) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { authService } = await import('../lib/auth');
      const updated = await authService.updateProfile(language);
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Could not save your preference.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page profile-page">
      <header className="page-head">
        <div>
          <h1>Your account</h1>
          <p>Profile, learning progress and preferences in one place.</p>
        </div>
      </header>

      <section className="profile-card cut-br" id="profile" aria-labelledby="profile-h">
        <div className="profile-id">
          <span className="profile-avatar" aria-hidden="true">
            {initials || '☺'}
          </span>
          <div>
            <h2 id="profile-h">{user.name}</h2>
            <p className="profile-meta">
              {user.email}
              <span className={`profile-role ${user.role === 'admin' ? 'is-admin' : ''}`}>
                {user.role}
              </span>
            </p>
          </div>
        </div>
        <dl className="profile-facts">
          <div>
            <dt>Account ID</dt>
            <dd className="mono">{user.id}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{user.phone || <span className="muted">Not provided</span>}</dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd>
              <span className="dot dot-ok" /> Signed in on this device
            </dd>
          </div>
        </dl>
      </section>

      <section className="profile-card cut-br" id="progress" aria-labelledby="progress-h">
        <h2 id="progress-h">Learning progress</h2>
        <StateBlock
          icon="spark"
          title="Progress tracking starts with your first lesson"
          body="Lessons you generate will appear in your Library, and completed scenes will be counted here once the backend records them."
          action={
            <a className="btn btn-primary" href="/">
              Create your first lesson
            </a>
          }
        />
      </section>

      <section className="profile-card cut-br" id="settings" aria-labelledby="settings-h">
        <h2 id="settings-h">Settings</h2>
        <div className="field profile-field">
          <label className="field-label" htmlFor="profile-language">
            Preferred learning language
          </label>
          <div className="profile-save-row">
            <select
              id="profile-language"
              className="input"
              value={user.language}
              disabled={saving}
              onChange={(e) => void saveLanguage(e.target.value)}
            >
              {[
                'en',
                'hi',
                'bn',
                'ta',
                'te',
                'mr',
                'kn',
                'ml',
                'gu',
                'pa',
                'ur',
                'es',
                'fr',
                'de',
                'ja',
                'zh',
                'ar',
                'pt',
                'ru',
                'ko',
              ].map((code) => {
                const l = getLanguage(code);
                return l ? (
                  <option key={code} value={code}>
                    {l.name} · {l.native}
                  </option>
                ) : null;
              })}
            </select>
            {saving && <Spinner size={15} />}
            {saved && (
              <span className="profile-saved" role="status">
                <Icon name="check" size={14} /> Saved
              </span>
            )}
          </div>
          {error && (
            <p className="auth-error" role="alert">
              <Icon name="alert" size={15} /> {error}
            </p>
          )}
        </div>

        <div className="profile-danger">
          <div>
            <b>Sign out</b>
            <span>Ends this session on the device. Your lessons stay saved.</span>
          </div>
          <button className="btn" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}
