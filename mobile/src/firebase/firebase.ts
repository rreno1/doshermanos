import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// Firebase's React Native runtime exports this function, but its Expo TypeScript
// resolution currently omits the export from the public declaration file.
// @ts-expect-error Remove this when Firebase's Expo typings expose the documented export.
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const deploymentProjectId = 'dos-hermanos-hilongos';
const allowedAppEnvironments = ['development', 'staging', 'production'] as const;
const appEnvironment = process.env.EXPO_PUBLIC_APP_ENV;

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

if (!allowedAppEnvironments.includes(appEnvironment as (typeof allowedAppEnvironments)[number])) {
  throw new Error('EXPO_PUBLIC_APP_ENV must be development, staging, or production.');
}

const isDeploymentEnvironment = appEnvironment === 'staging' || appEnvironment === 'production';

if (isDeploymentEnvironment && firebaseConfig.projectId !== deploymentProjectId) {
  throw new Error(
    'Staging and production builds must connect to the approved Firebase deployment project.',
  );
}

if (!isDeploymentEnvironment && firebaseConfig.projectId === deploymentProjectId) {
  throw new Error(
    'Local development cannot connect to the shared staging/production Firebase project. Configure a separate development project instead.',
  );
}

const existingApp = getApps()[0];
const firebaseApp = existingApp ?? initializeApp(firebaseConfig);

export const firebaseAuth = existingApp
  ? getAuth(firebaseApp)
  : initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export const firestore = getFirestore(firebaseApp);
