import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  getIdTokenResult,
  reauthenticateWithPopup,
  setPersistence,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from '@core/firebase/firebase';
import type { UserRole } from './auth.types';

export const SENSITIVE_ACTION_REAUTH_WINDOW_MS = 10 * 60 * 1000;
export const UNTRUSTED_IDENTITY_MESSAGE = 'Only a verified Google account can use Dos Hermanos.';

export function isTrustedGoogleUser(user: User): boolean {
  return !user.isAnonymous
    && user.emailVerified
    && user.providerData.some((provider) => provider.providerId === 'google.com');
}

export async function applyRoleAuthPersistence(role: UserRole): Promise<void> {
  const persistence = role === 'admin' || role === 'staff'
    ? browserSessionPersistence
    : browserLocalPersistence;

  await setPersistence(firebaseAuth, persistence);
}

export async function ensureRecentGoogleAuthentication(now = Date.now()): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user || !isTrustedGoogleUser(user)) {
    throw new Error(UNTRUSTED_IDENTITY_MESSAGE);
  }

  const tokenResult = await getIdTokenResult(user);
  const authenticatedAt = Date.parse(tokenResult.authTime);
  const authenticationIsRecent = Number.isFinite(authenticatedAt)
    && now - authenticatedAt <= SENSITIVE_ACTION_REAUTH_WINDOW_MS;

  if (authenticationIsRecent) return;

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await reauthenticateWithPopup(user, provider);

  if (!isTrustedGoogleUser(credential.user)) {
    throw new Error(UNTRUSTED_IDENTITY_MESSAGE);
  }
}
