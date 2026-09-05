import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseAuth, firestore } from '@core/firebase/firebase';
import { clearSessionActivity, markSessionActivity } from './session-inactivity';
import type { UserProfile, UserRole, UserStatus } from './auth.types';

const validRoles: UserRole[] = ['customer', 'staff', 'admin'];
const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

function parseUserProfile(userId: string, value: unknown): UserProfile {
  if (!value || typeof value !== 'object') {
    throw new Error('Account profile is invalid.');
  }

  const profileData = value as Record<string, unknown>;
  const role = profileData.role;
  const status = profileData.status;

  if (
    typeof profileData.displayName !== 'string' ||
    typeof role !== 'string' ||
    !validRoles.includes(role as UserRole) ||
    typeof status !== 'string' ||
    !validStatuses.includes(status as UserStatus)
  ) {
    throw new Error('Account profile is invalid.');
  }

  return {
    id: userId,
    displayName: profileData.displayName,
    role: role as UserRole,
    status: status as UserStatus,
  };
}

function getGoogleDisplayName(user: User): string {
  const displayName = user.displayName?.trim();

  if (displayName) {
    return displayName.slice(0, 100);
  }

  const emailName = user.email?.split('@')[0]?.trim();
  return (emailName || 'Customer').slice(0, 100);
}

async function createCustomerProfile(user: User): Promise<void> {
  const profileRef = doc(firestore, 'users', user.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (profileSnapshot.exists()) {
    return;
  }

  await setDoc(profileRef, {
    displayName: getGoogleDisplayName(user),
    role: 'customer',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function loadUserProfile(user: User): Promise<UserProfile | null> {
  const profileRef = doc(firestore, 'users', user.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (!profileSnapshot.exists()) {
    return null;
  }

  return parseUserProfile(user.uid, profileSnapshot.data());
}

export async function signInWithGoogle(): Promise<void> {
  const credential = await signInWithPopup(firebaseAuth, googleProvider);

  try {
    await createCustomerProfile(credential.user);
    markSessionActivity();
  } catch (error) {
    clearSessionActivity();
    await signOut(firebaseAuth);
    throw error;
  }
}

export async function signOutCurrentUser(): Promise<void> {
  clearSessionActivity();
  await signOut(firebaseAuth);
}

export function getSafeAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.';
    case 'auth/unauthorized-domain':
      return 'This site is not yet authorized for Google sign-in in Firebase Authentication.';
    case 'auth/account-exists-with-different-credential':
      return 'This email already uses a different sign-in method.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a while and try again.';
    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled yet. Enable Google in Firebase Authentication.';
    default:
      return 'We could not complete Google sign-in. Please try again.';
  }
}
