import { Route, Routes } from 'react-router-dom';
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AppShell } from './components/AppShell';
import { StateBlock } from './components/ui';
import { RequireAuth } from './lib/auth';
import { HomePage } from './pages/HomePage';
import { StudioPage } from './pages/StudioPage';
import { LanguagesPage } from './pages/LanguagesPage';
import { LibraryPage } from './pages/LibraryPage';
import { ExportPage } from './pages/ExportPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Blu UI error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, maxWidth: 720, margin: '0 auto' }}>
          <StateBlock
            icon="alert"
            tone="error"
            title="The studio hit an unexpected error"
            body={`${this.state.error.message}. Your lessons are untouched — reloading restores the interface.`}
            action={
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Reload the studio
              </button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public auth pages — authenticated visitors are bounced onward. */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        {/* Everything else requires a live session (redirects to /login). */}
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="studio" element={<StudioPage />} />
          <Route path="languages" element={<LanguagesPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route
            path="*"
            element={
              <div className="page">
                <StateBlock
                  icon="folder"
                  title="That page is not part of the studio"
                  body="The route you asked for does not exist in Blu Visual Teacher."
                  action={
                    <a className="btn btn-primary" href="/">
                      Back to the console
                    </a>
                  }
                />
              </div>
            }
          />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}