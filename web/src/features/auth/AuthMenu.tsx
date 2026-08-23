import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  getSafeAuthErrorMessage,
  registerCustomer,
  resetPassword,
  signInWithEmail,
  signOutCurrentUser,
} from './auth.service';
import { useAuth } from './AuthProvider';
import './auth.css';

type FormMode = 'sign_in' | 'register' | 'reset_password';

export function AuthMenu() {
  const { authState, refreshAuthState } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('sign_in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function closeDialog() {
    setIsOpen(false);
    setPassword('');
    setConfirmPassword('');
    setMessage(null);
    setIsError(false);
  }

  function switchMode(nextMode: FormMode) {
    setFormMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setMessage(null);
    setIsError(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    if (formMode === 'register') {
      if (displayName.trim().length < 2) {
        setMessage('Enter your full name.');
        setIsError(true);
        return;
      }

      if (password.length < 10) {
        setMessage('Use at least 10 characters for your password.');
        setIsError(true);
        return;
      }

      if (password !== confirmPassword) {
        setMessage('The passwords do not match.');
        setIsError(true);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (formMode === 'sign_in') {
        await signInWithEmail(email, password);
        await refreshAuthState();
        closeDialog();
        return;
      }

      if (formMode === 'register') {
        await registerCustomer(displayName, email, password);
        await refreshAuthState();
        closeDialog();
        return;
      }

      await resetPassword(email);
      setMessage(
        'If an account uses that email address, Firebase will send password reset instructions.',
      );
    } catch (error) {
      setMessage(getSafeAuthErrorMessage(error));
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      await signOutCurrentUser();
      closeDialog();
    } catch (error) {
      setMessage(getSafeAuthErrorMessage(error));
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  const buttonLabel =
    authState.status === 'active' && authState.profile
      ? authState.profile.displayName
      : 'Sign in';

  return (
    <>
      <button
        className="auth-trigger"
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={authState.status === 'loading'}
      >
        {authState.status === 'loading' ? 'Account' : buttonLabel}
      </button>

      <dialog
        className="auth-dialog"
        ref={dialogRef}
        onClose={() => setIsOpen(false)}
      >
        <div className="auth-panel">
          <div className="auth-panel-heading">
            <div>
              <p className="auth-eyebrow">Dos Hermanos account</p>
              <h2>{getPanelTitle(authState.status, formMode)}</h2>
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

          {authState.status === 'active' && authState.profile ? (
            <AccountSummary
              displayName={authState.profile.displayName}
              role={authState.profile.role}
              isSubmitting={isSubmitting}
              message={message}
              isError={isError}
              onSignOut={() => void handleSignOut()}
            />
          ) : null}

          {authState.status === 'inactive' || authState.status === 'suspended' ? (
            <AccountUnavailable
              status={authState.status}
              isSubmitting={isSubmitting}
              onSignOut={() => void handleSignOut()}
            />
          ) : null}

          {authState.status === 'error' ? (
            <div className="auth-message auth-message-error" role="alert">
              We could not load your account profile. Sign out and try again, or contact an administrator if the problem continues.
            </div>
          ) : null}

          {authState.status === 'error' ? (
            <button
              className="auth-secondary-button"
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isSubmitting}
            >
              Sign out
            </button>
          ) : null}

          {authState.status === 'signed_out' ? (
            <AuthForm
              mode={formMode}
              displayName={displayName}
              email={email}
              password={password}
              confirmPassword={confirmPassword}
              isSubmitting={isSubmitting}
              message={message}
              isError={isError}
              onDisplayNameChange={setDisplayName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onSubmit={handleSubmit}
              onModeChange={switchMode}
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}

function getPanelTitle(status: string, mode: FormMode) {
  if (status === 'active') {
    return 'Your account';
  }

  if (status === 'inactive' || status === 'suspended') {
    return 'Account access unavailable';
  }

  if (status === 'error') {
    return 'Account setup issue';
  }

  if (mode === 'register') {
    return 'Create your customer account';
  }

  if (mode === 'reset_password') {
    return 'Reset your password';
  }

  return 'Sign in';
}

type AuthFormProps = {
  mode: FormMode;
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  message: string | null;
  isError: boolean;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onModeChange: (mode: FormMode) => void;
};

function AuthForm({
  mode,
  displayName,
  email,
  password,
  confirmPassword,
  isSubmitting,
  message,
  isError,
  onDisplayNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onModeChange,
}: AuthFormProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {mode === 'register' ? (
        <label className="auth-field">
          <span>Full name</span>
          <input
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            required
            maxLength={100}
          />
        </label>
      ) : null}

      <label className="auth-field">
        <span>Email address</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          required
        />
      </label>

      {mode !== 'reset_password' ? (
        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            required
          />
        </label>
      ) : null}

      {mode === 'register' ? (
        <label className="auth-field">
          <span>Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
            required
          />
        </label>
      ) : null}

      {message ? (
        <div
          className={isError ? 'auth-message auth-message-error' : 'auth-message'}
          role={isError ? 'alert' : 'status'}
        >
          {message}
        </div>
      ) : null}

      <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait…' : getSubmitLabel(mode)}
      </button>

      <div className="auth-mode-actions">
        {mode !== 'sign_in' ? (
          <button type="button" onClick={() => onModeChange('sign_in')}>
            Sign in instead
          </button>
        ) : null}
        {mode !== 'register' ? (
          <button type="button" onClick={() => onModeChange('register')}>
            Create account
          </button>
        ) : null}
        {mode === 'sign_in' ? (
          <button type="button" onClick={() => onModeChange('reset_password')}>
            Forgot password?
          </button>
        ) : null}
      </div>
    </form>
  );
}

function getSubmitLabel(mode: FormMode) {
  if (mode === 'register') {
    return 'Create account';
  }

  if (mode === 'reset_password') {
    return 'Send reset instructions';
  }

  return 'Sign in';
}

type AccountSummaryProps = {
  displayName: string;
  role: string;
  isSubmitting: boolean;
  message: string | null;
  isError: boolean;
  onSignOut: () => void;
};

function AccountSummary({
  displayName,
  role,
  isSubmitting,
  message,
  isError,
  onSignOut,
}: AccountSummaryProps) {
  return (
    <div className="auth-account-summary">
      <div>
        <span className="auth-account-label">Signed in as</span>
        <strong>{displayName}</strong>
        <span className="auth-account-role">{formatRole(role)}</span>
      </div>

      {message ? (
        <div
          className={isError ? 'auth-message auth-message-error' : 'auth-message'}
          role={isError ? 'alert' : 'status'}
        >
          {message}
        </div>
      ) : null}

      <button
        className="auth-secondary-button"
        type="button"
        onClick={onSignOut}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}

function AccountUnavailable({
  status,
  isSubmitting,
  onSignOut,
}: {
  status: 'inactive' | 'suspended';
  isSubmitting: boolean;
  onSignOut: () => void;
}) {
  return (
    <div className="auth-account-summary">
      <div className="auth-message auth-message-error" role="alert">
        {status === 'suspended'
          ? 'This account is suspended and cannot access protected business data.'
          : 'This account is inactive and cannot access protected business data.'}
      </div>
      <button
        className="auth-secondary-button"
        type="button"
        onClick={onSignOut}
        disabled={isSubmitting}
      >
        Sign out
      </button>
    </div>
  );
}

function formatRole(role: string) {
  if (role === 'admin') {
    return 'Administrator';
  }

  if (role === 'staff') {
    return 'Staff';
  }

  return 'Customer';
}
