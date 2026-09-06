import {
  Timestamp,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '@core/firebase/firebase';
import { ensureRecentGoogleAuthentication } from '@modules/auth/auth-security';
import type { UserProfile, UserRole, UserStatus } from '@modules/auth/auth.types';

const USER_LIMIT = 100;
const ACCESS_EVENT_LIMIT = 30;
const validRoles: UserRole[] = ['customer', 'staff', 'admin'];
const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];

export type UserAccessActor = {
  id: string;
  displayName: string;
};

export type UserAccessEvent = {
  id: string;
  targetUserId: string;
  targetDisplayName: string;
  previousRole: UserRole;
  newRole: UserRole;
  previousStatus: UserStatus;
  newStatus: UserStatus;
  changedBy: string;
  changedByName: string;
  createdAt: Date;
};

function parseUser(document: QueryDocumentSnapshot<DocumentData>): UserProfile {
  const data = document.data();

  if (
    typeof data.displayName !== 'string' ||
    !isUserRole(data.role) ||
    !isUserStatus(data.status)
  ) {
    throw new Error('User profile is invalid.');
  }

  return {
    id: document.id,
    displayName: data.displayName,
    role: data.role,
    status: data.status,
  };
}

function parseUserAccessEvent(document: QueryDocumentSnapshot<DocumentData>): UserAccessEvent {
  const data = document.data({ serverTimestamps: 'estimate' });

  if (
    typeof data.targetUserId !== 'string' ||
    typeof data.targetDisplayName !== 'string' ||
    !isUserRole(data.previousRole) ||
    !isUserRole(data.newRole) ||
    !isUserStatus(data.previousStatus) ||
    !isUserStatus(data.newStatus) ||
    typeof data.changedBy !== 'string' ||
    typeof data.changedByName !== 'string' ||
    !(data.createdAt instanceof Timestamp)
  ) {
    throw new Error('User access audit data is invalid.');
  }

  return {
    id: document.id,
    targetUserId: data.targetUserId,
    targetDisplayName: data.targetDisplayName,
    previousRole: data.previousRole,
    newRole: data.newRole,
    previousStatus: data.previousStatus,
    newStatus: data.newStatus,
    changedBy: data.changedBy,
    changedByName: data.changedByName,
    createdAt: data.createdAt.toDate(),
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

export function subscribeToRecentUserAccessEvents(
  onEvents: (events: UserAccessEvent[]) => void,
  onError: () => void,
): Unsubscribe {
  const eventsQuery = query(
    collection(firestore, 'userAccessEvents'),
    orderBy('createdAt', 'desc'),
    limit(ACCESS_EVENT_LIMIT),
  );

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      try {
        onEvents(snapshot.docs.map(parseUserAccessEvent));
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
  actor: UserAccessActor,
): Promise<void> {
  if (userId === actor.id) {
    throw new Error('Your current administrator account cannot change its own access.');
  }

  await ensureRecentGoogleAuthentication();

  const userRef = doc(firestore, 'users', userId);
  const eventRef = doc(collection(firestore, 'userAccessEvents'));

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (!snapshot.exists()) {
      throw new Error('User profile could not be found.');
    }

    const current = snapshot.data();
    if (
      typeof current.displayName !== 'string' ||
      !isUserRole(current.role) ||
      !isUserStatus(current.status)
    ) {
      throw new Error('User profile is invalid.');
    }

    if (current.role === role && current.status === status) {
      return;
    }

    transaction.update(userRef, {
      role,
      status,
      lastAccessEventId: eventRef.id,
      updatedAt: serverTimestamp(),
    });
    transaction.set(eventRef, {
      targetUserId: userId,
      targetDisplayName: current.displayName,
      previousRole: current.role,
      newRole: role,
      previousStatus: current.status,
      newStatus: status,
      changedBy: actor.id,
      changedByName: actor.displayName,
      createdAt: serverTimestamp(),
    });
  });
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && validRoles.includes(value as UserRole);
}

function isUserStatus(value: unknown): value is UserStatus {
  return typeof value === 'string' && validStatuses.includes(value as UserStatus);
}
