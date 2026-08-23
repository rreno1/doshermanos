import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// Firebase's React Native runtime exports this function, but its Expo TypeScript
// resolution currently omits the export from the public declaration file.
// @ts-expect-error Remove this when Firebase's Expo typings expose the documented export.
import { getReactNativePersistence } from 'firebase/auth';
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

const existingApp = getApps()[0];
const firebaseApp = existingApp ?? initializeApp(firebaseConfig);

export const firebaseAuth = existingApp
  ? getAuth(firebaseApp)
  : initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export const firestore = getFirestore(firebaseApp);
