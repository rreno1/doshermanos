import { useState } from 'react';
import { ResponsiveButtonContent } from '../../app/ResponsiveButtonContent';
import { getSafeAuthErrorMessage, signOutCurrentUser } from './auth.service';
import type { UserProfile } from './auth.types';

type AccountPanelProps = {
  status: 'active' | 'inactive' | 'suspended' | 'error';
  profile: UserProfile | null;
  onSignedOut: () => void;
};

export function AccountPanel({ status, profile, onSignedOut }: AccountPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignOut() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await signOutCurrentUser();
      onSignedOut();
    } catch (error) {
      setMessage(getSafeAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === 'active' && profile) {
    return (
      <div className="auth-account-summary">
        <div>
          <span className="auth-account-label">Signed in as</span>
          <strong>{profile.displayName}</strong>
          <span className="auth-account-role">{formatRole(profile.role)}</span>
        </div>

        {message ? (
          <div className="auth-message auth-message-error" role="alert">
            {message}
          </div>
        ) : null}

        <SignOutButton isSubmitting={isSubmitting} onClick={() => void handleSignOut()} />
      </div>
    );
  }

  const unavailableMessage = getUnavailableMessage(status);

  return (
    <div className="auth-account-summary">
      <div className="auth-message auth-message-error" role="alert">
        {unavailableMessage}
      </div>

      {message ? (
        <div className="auth-message auth-message-error" role="alert">
          {message}
        </div>
      ) : null}

      <SignOutButton isSubmitting={isSubmitting} onClick={() => void handleSignOut()} />
    </div>
  );
}

function SignOutButton({
  isSubmitting,
  onClick,
}: {
  isSubmitting: boolean;
  onClick: () => void;
}) {
  const label = isSubmitting ? 'Signing out…' : 'Sign out';

  return (
    <button
      className="auth-secondary-button responsive-action-button"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={isSubmitting}
    >
      <ResponsiveButtonContent icon="signout" label={label} />
    </button>
  );
}

function getUnavailableMessage(status: AccountPanelProps['status']) {
  if (status === 'suspended') {
    return 'This account is suspended and cannot access protected business data.';
  }

  if (status === 'inactive') {
    return 'This account is inactive and cannot access protected business data.';
  }

  return 'We could not load your account profile. Sign out and try again, or contact an administrator if the problem continues.';
}

function formatRole(role: UserProfile['role']) {
  if (role === 'admin') {
    return 'Administrator';
  }

  if (role === 'staff') {
    return 'Staff';
  }

  return 'Customer';
}
