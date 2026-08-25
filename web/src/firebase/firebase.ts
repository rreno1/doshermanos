import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const productionProjectId = 'dos-hermanos-hilongos';
const runtimeMode = import.meta.env.MODE;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingConfigValue = Object.values(firebaseConfig).some(
  (value) => typeof value !== 'string' || value.trim().length === 0,
);

if (missingConfigValue) {
  throw new Error('Firebase client configuration is incomplete.');
}

if (runtimeMode === 'production' && firebaseConfig.projectId !== productionProjectId) {
  throw new Error(
    'Production mode must connect to the approved production Firebase project.',
  );
}

if (runtimeMode !== 'production' && firebaseConfig.projectId === productionProjectId) {
  throw new Error(
    'Non-production mode cannot connect to the production Firebase project. Configure a separate development or staging project instead.',
  );
}

const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
