import { useState } from 'react';
import { getSafeAuthErrorMessage, signInWithGoogle } from './auth.service';

type AuthFormProps = {
  onAuthenticated: () => Promise<void>;
};

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
        Use your Google account to continue. New customers are set up automatically on their first sign-in.
      </p>

      {message ? (
        <div className="auth-message auth-message-error" role="alert">
          {message}
        </div>
      ) : null}

      <button
        className="auth-primary-button"
        type="button"
        disabled={isSubmitting}
        onClick={() => void handleGoogleSignIn()}
      >
        {isSubmitting ? 'Opening Google…' : 'Continue with Google'}
      </button>
    </div>
  );
}
