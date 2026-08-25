import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AppErrorBoundary } from './app/AppErrorBoundary';
import { ToastProvider } from './app/ToastProvider';
import { AuthProvider } from './features/auth/AuthProvider';
import './styles/global.css';
import './app/app-loading.css';
import './app/management-interactions.css';
import './app/toast.css';

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
