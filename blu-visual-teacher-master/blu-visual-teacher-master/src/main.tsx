import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/home.css';
import './styles/studio.css';
import './styles/pages.css';
import './styles/auth.css';
import { App } from './App';
import { StoreProvider } from './lib/store';
import { AuthProvider } from './lib/auth';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);