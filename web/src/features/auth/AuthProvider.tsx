import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { firebaseAuth } from '../../firebase/firebase';
import { loadUserProfile } from './auth.service';
import type { UserProfile } from './auth.types';

type AuthStatus =
  | 'loading'
  | 'signed_out'
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'error';

type AuthState = {
  status: AuthStatus;
  profile: UserProfile | null;
};

type AuthContextValue = {
  authState: AuthState;
  loadingMessage: string | null;
  refreshAuthState: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const profileCreationRetryCount = 4;
const profileCreationRetryDelayMs = 250;

const signedOutState: AuthState = {
  status: 'signed_out',
  profile: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    status: 'loading',
    profile: null,
  });
  const [loadingMessage, setLoadingMessage] = useState<string | null>('Checking your session…');
  const resolutionNumber = useRef(0);

  const resolveUser = useCallback(async (user: User | null) => {
    const currentResolution = resolutionNumber.current + 1;
    resolutionNumber.current = currentResolution;

    if (!user) {
      setLoadingMessage(null);
      setAuthState(signedOutState);
      return;
    }

    setLoadingMessage('Loading your account…');
    setAuthState({ status: 'loading', profile: null });

    try {
      const profile = await loadProfileAfterAuthChange(user);

      if (resolutionNumber.current !== currentResolution) {
        return;
      }

      if (!profile) {
        setLoadingMessage(null);
        setAuthState({ status: 'error', profile: null });
        return;
      }

      setLoadingMessage(null);
      setAuthState({
        status: profile.status,
        profile,
      });
    } catch {
      if (resolutionNumber.current !== currentResolution) {
        return;
      }

      setLoadingMessage(null);
      setAuthState({ status: 'error', profile: null });
    }
  }, []);

  const refreshAuthState = useCallback(async () => {
    setLoadingMessage(firebaseAuth.currentUser ? 'Refreshing your account…' : 'Checking your session…');
    await resolveUser(firebaseAuth.currentUser);
  }, [resolveUser]);

  useEffect(() => {
    setLoadingMessage('Checking your session…');
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      void resolveUser(user);
    });

    return () => {
      resolutionNumber.current += 1;
      unsubscribe();
    };
  }, [resolveUser]);

  return (
    <AuthContext.Provider value={{ authState, loadingMessage, refreshAuthState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}

async function loadProfileAfterAuthChange(user: User): Promise<UserProfile | null> {
  for (let attempt = 0; attempt < profileCreationRetryCount; attempt += 1) {
    const profile = await loadUserProfile(user);

    if (profile) {
      return profile;
    }

    const hasAnotherAttempt = attempt < profileCreationRetryCount - 1;
    if (hasAnotherAttempt) {
      await wait(profileCreationRetryDelayMs);
    }
  }

  return null;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
