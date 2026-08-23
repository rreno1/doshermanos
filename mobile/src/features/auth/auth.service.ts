import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseAuth, firestore } from '../../firebase/firebase';
import type { UserProfile, UserRole, UserStatus } from './auth.types';

function parseUserProfile(userId: string, value: unknown): UserProfile {
  if (!value || typeof value !== 'object') {
    throw new Error('Account profile is invalid.');
  }

  const profileData = value as Record<string, unknown>;
  const role = profileData.role;
  const status = profileData.status;

  if (
    typeof profileData.displayName !== 'string' ||
    !['customer', 'staff', 'admin'].includes(String(role)) ||
    !['active', 'inactive', 'suspended'].includes(String(status))
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

async function createCustomerProfile(user: User): Promise<UserProfile> {
  const displayName = user.displayName?.trim();

  if (!displayName) {
    throw new Error('Your account profile is incomplete.');
  }

  const profileRef = doc(firestore, 'users', user.uid);

  await setDoc(profileRef, {
    displayName,
    role: 'customer',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: user.uid,
    displayName,
    role: 'customer',
    status: 'active',
  };
}

export async function loadUserProfile(user: User): Promise<UserProfile> {
  const profileRef = doc(firestore, 'users', user.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (!profileSnapshot.exists()) {
    return createCustomerProfile(user);
  }

  return parseUserProfile(user.uid, profileSnapshot.data());
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function registerCustomer(
  displayName: string,
  email: string,
  password: string,
): Promise<void> {
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email.trim(),
    password,
  );

  await updateProfile(credential.user, {
    displayName: displayName.trim(),
  });

  await createCustomerProfile(credential.user);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(firebaseAuth, email.trim());
}

export async function signOutCurrentUser(): Promise<void> {
  await signOut(firebaseAuth);
}

export function getSafeAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'The email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account already uses this email address.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Use a stronger password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a while and try again.';
    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Authentication is not enabled yet. Enable Email/Password in Firebase Authentication.';
    default:
      return 'We could not complete that account action. Please try again.';
  }
}
