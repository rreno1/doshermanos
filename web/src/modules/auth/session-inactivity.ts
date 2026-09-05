import { signOut } from 'firebase/auth';
import { useEffect, useRef } from 'react';
import { firebaseAuth } from '@core/firebase/firebase';

export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const activityWriteThrottleMs = 15 * 1000;
const activityStorageKey = 'dos-hermanos:last-authenticated-activity';

export function markSessionActivity(now = Date.now()) {
  try {
    window.localStorage.setItem(activityStorageKey, String(now));
  } catch {
    // The in-memory timer still protects the current tab if storage is unavailable.
  }
}

export function clearSessionActivity() {
  try {
    window.localStorage.removeItem(activityStorageKey);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

export function readLastSessionActivity(): number | null {
  try {
    const storedValue = window.localStorage.getItem(activityStorageKey);
    if (!storedValue) return null;

    const timestamp = Number(storedValue);
    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
  } catch {
    return null;
  }
}

export function isSessionExpired(
  lastActivity: number,
  now = Date.now(),
  timeoutMs = SESSION_IDLE_TIMEOUT_MS,
) {
  return now - lastActivity >= timeoutMs;
}

export function useSessionInactivity(enabled: boolean) {
  const lastMemoryActivity = useRef(Date.now());
  const lastWrittenActivity = useRef(0);

  useEffect(() => {
    if (!enabled || !firebaseAuth.currentUser) return;

    let timeoutId: number | null = null;
    let isSigningOut = false;

    const storedActivity = readLastSessionActivity();
    if (storedActivity === null) {
      const now = Date.now();
      lastMemoryActivity.current = now;
      lastWrittenActivity.current = now;
      markSessionActivity(now);
    } else {
      lastMemoryActivity.current = storedActivity;
      lastWrittenActivity.current = storedActivity;
    }

    function readActivity() {
      const stored = readLastSessionActivity();
      return stored === null
        ? lastMemoryActivity.current
        : Math.max(stored, lastMemoryActivity.current);
    }

    function clearTimer() {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    function scheduleExpiration(lastActivity: number) {
      clearTimer();
      const remaining = Math.max(0, SESSION_IDLE_TIMEOUT_MS - (Date.now() - lastActivity));
      timeoutId = window.setTimeout(() => {
        void expireIfNeeded();
      }, remaining);
    }

    async function signOutExpiredSession() {
      if (isSigningOut) return;
      isSigningOut = true;
      clearTimer();
      clearSessionActivity();

      try {
        await signOut(firebaseAuth);
      } finally {
        isSigningOut = false;
      }
    }

    function expireIfNeeded() {
      const lastActivity = readActivity();
      if (isSessionExpired(lastActivity)) {
        void signOutExpiredSession();
        return true;
      }

      scheduleExpiration(lastActivity);
      return false;
    }

    function recordActivity() {
      if (expireIfNeeded()) return;

      const now = Date.now();
      lastMemoryActivity.current = now;

      if (now - lastWrittenActivity.current >= activityWriteThrottleMs) {
        lastWrittenActivity.current = now;
        markSessionActivity(now);
      }

      scheduleExpiration(now);
    }

    function checkAfterResume() {
      expireIfNeeded();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        checkAfterResume();
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== activityStorageKey) return;
      const nextActivity = readLastSessionActivity();
      if (nextActivity !== null && nextActivity > lastMemoryActivity.current) {
        lastMemoryActivity.current = nextActivity;
        scheduleExpiration(nextActivity);
      }
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'pointermove',
      'keydown',
      'touchstart',
      'scroll',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    window.addEventListener('focus', checkAfterResume);
    window.addEventListener('pageshow', checkAfterResume);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    expireIfNeeded();

    return () => {
      clearTimer();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      window.removeEventListener('focus', checkAfterResume);
      window.removeEventListener('pageshow', checkAfterResume);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);
}
