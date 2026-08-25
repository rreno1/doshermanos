import { useState } from 'react';
import { getSafeAuthErrorMessage, signInWithGoogle } from './auth.service';

type AuthFormProps = {
  onAuthenticated: () => Promise<void>;
};

function GoogleLogo() {
  return (
    <svg
      className="auth-google-logo"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.21-2.27H12v4.51h6.45a5.52 5.52 0 0 1-2.39 3.52v2.92h3.87c2.27-2.09 3.56-5.17 3.56-8.68Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.87-2.92c-1.07.72-2.44 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.04A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.38A7.22 7.22 0 0 1 4.89 12c0-.83.14-1.64.38-2.38V6.58H1.28A12 12 0 0 0 0 12c0 1.94.46 3.78 1.28 5.42l3.99-3.04Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.67c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.54 11.54 0 0 0 12 0 12 12 0 0 0 1.28 6.58l3.99 3.04C6.22 6.78 8.87 4.67 12 4.67Z"
      />
    </svg>
  );
}

export function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await signInWithGoogle();
      await onAuthenticated();
    } catch (error) {
      setMessage(getSafeAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-form">
      <p className="auth-message">
        Sign in securely with Google. New customers are set up automatically on their first sign-in.
      </p>

      {message ? (
        <div className="auth-message auth-message-error" role="alert">
          {message}
        </div>
      ) : null}

      <button
        className="auth-google-button"
        type="button"
        disabled={isSubmitting}
        onClick={() => void handleGoogleSignIn()}
      >
        <GoogleLogo />
        <span>{isSubmitting ? 'Opening Google…' : 'Continue with Google'}</span>
      </button>

      <p className="auth-provider-note">
        Authentication is handled by Google through Firebase Authentication.
      </p>
    </div>
  );
}
