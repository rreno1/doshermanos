import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingConfigValue = Object.values(firebaseConfig).some(
  (value) => typeof value !== 'string' || value.trim().length === 0,
);

if (missingConfigValue) {
  throw new Error('Firebase client configuration is incomplete.');
}

const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
