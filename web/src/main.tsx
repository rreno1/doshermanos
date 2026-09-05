import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppErrorBoundary } from '@core/app/AppErrorBoundary';
import { AuthProvider } from '@modules/auth/AuthProvider';
import { ToastProvider } from '@shared/ui/ToastProvider';
import '@styles/global.css';
import '@styles/typography.css';
import '@styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Application root element is missing.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
