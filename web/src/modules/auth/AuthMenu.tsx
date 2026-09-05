import { useEffect, useRef, useState } from 'react';
import { ResponsiveButtonContent } from '@shared/ui/ResponsiveButtonContent';
import { AccountPanel } from './AccountPanel';
import { AuthForm } from './AuthForm';
import { useAuth } from './AuthProvider';
import './auth.css';

export function AuthMenu() {
  const { authState, refreshAuthState } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function closeDialog() {
    setIsOpen(false);
  }

  async function handleAuthenticated() {
    await refreshAuthState();
    closeDialog();
  }

  const buttonLabel =
    authState.status === 'active' && authState.profile
      ? authState.profile.displayName
      : 'Google login';
  const visibleLabel = authState.status === 'loading' ? 'Account' : buttonLabel;
  const panelTitle = getPanelTitle(authState.status);

  return (
    <>
      <button
        className="auth-trigger responsive-action-button"
        type="button"
        aria-label={visibleLabel}
        title={visibleLabel}
        onClick={() => setIsOpen(true)}
        disabled={authState.status === 'loading'}
      >
        <ResponsiveButtonContent icon="account" label={visibleLabel} />
      </button>

      <dialog
        className="auth-dialog"
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClose={closeDialog}
        aria-labelledby="auth-dialog-title"
      >
        {isOpen ? (
          <div className="auth-panel">
            <div className="auth-panel-heading">
              <div>
                <p className="auth-eyebrow">Dos Hermanos account</p>
                <h2 id="auth-dialog-title">{panelTitle}</h2>
              </div>
              <button
                className="auth-close"
                type="button"
                aria-label="Close account dialog"
                onClick={closeDialog}
              >
                ×
              </button>
            </div>

            {authState.status === 'signed_out' ? (
              <AuthForm onAuthenticated={handleAuthenticated} />
            ) : null}

            {authState.status === 'active'
            || authState.status === 'inactive'
            || authState.status === 'suspended'
            || authState.status === 'error' ? (
              <AccountPanel
                status={authState.status}
                profile={authState.profile}
                onSignedOut={closeDialog}
              />
            ) : null}

            {authState.status === 'loading' ? (
              <div className="auth-message" role="status">
                Checking your account…
              </div>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}

function getPanelTitle(status: string) {
  if (status === 'active') return 'Your account';
  if (status === 'inactive' || status === 'suspended') return 'Account access unavailable';
  if (status === 'error') return 'Account setup issue';
  return 'Continue with Google';
}
