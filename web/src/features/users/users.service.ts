import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import type { UserProfile, UserRole, UserStatus } from '../auth/auth.types';

const USER_LIMIT = 100;
const validRoles: UserRole[] = ['customer', 'staff', 'admin'];
const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];

function parseUser(document: QueryDocumentSnapshot<DocumentData>): UserProfile {
  const data = document.data();

  if (
    typeof data.displayName !== 'string' ||
    typeof data.role !== 'string' ||
    !validRoles.includes(data.role as UserRole) ||
    typeof data.status !== 'string' ||
    !validStatuses.includes(data.status as UserStatus)
  ) {
    throw new Error('User profile is invalid.');
  }

  return {
    id: document.id,
    displayName: data.displayName,
    role: data.role as UserRole,
    status: data.status as UserStatus,
  };
}

export function subscribeToUsers(
  onUsers: (users: UserProfile[]) => void,
  onError: () => void,
): Unsubscribe {
  const usersQuery = query(collection(firestore, 'users'), limit(USER_LIMIT));

  return onSnapshot(
    usersQuery,
    (snapshot) => {
      try {
        const users = snapshot.docs
          .map(parseUser)
          .sort((leftUser, rightUser) => leftUser.displayName.localeCompare(rightUser.displayName));
        onUsers(users);
      } catch {
        onError();
      }
    },
    onError,
  );
}

export async function updateUserAccess(
  userId: string,
  role: UserRole,
  status: UserStatus,
): Promise<void> {
  await updateDoc(doc(firestore, 'users', userId), {
    role,
    status,
    updatedAt: serverTimestamp(),
  });
}
