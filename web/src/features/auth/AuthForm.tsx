import { useState, type FormEvent } from 'react';
import {
  getSafeAuthErrorMessage,
  registerCustomer,
  resetPassword,
  signInWithEmail,
} from './auth.service';

type FormMode = 'sign_in' | 'register' | 'reset_password';

type AuthFormProps = {
  onAuthenticated: () => Promise<void>;
};

export function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [mode, setMode] = useState<FormMode>('sign_in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function switchMode(nextMode: FormMode) {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setMessage(null);
    setIsError(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    if (mode === 'register') {
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
      if (mode === 'sign_in') {
        await signInWithEmail(email, password);
        await onAuthenticated();
        return;
      }

      if (mode === 'register') {
        await registerCustomer(displayName, email, password);
        await onAuthenticated();
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

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === 'register' ? (
        <label className="auth-field">
          <span>Full name</span>
          <input
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
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
          onChange={(event) => setEmail(event.target.value)}
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
            onChange={(event) => setPassword(event.target.value)}
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
            onChange={(event) => setConfirmPassword(event.target.value)}
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
          <button type="button" onClick={() => switchMode('sign_in')}>
            Sign in instead
          </button>
        ) : null}
        {mode !== 'register' ? (
          <button type="button" onClick={() => switchMode('register')}>
            Create account
          </button>
        ) : null}
        {mode === 'sign_in' ? (
          <button type="button" onClick={() => switchMode('reset_password')}>
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
