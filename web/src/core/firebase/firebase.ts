import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const deploymentProjectId = 'dos-hermanos-hilongos';
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

const isDeploymentMode = runtimeMode === 'staging' || runtimeMode === 'production';

if (isDeploymentMode && firebaseConfig.projectId !== deploymentProjectId) {
  throw new Error(
    'Staging and production builds must connect to the approved Firebase deployment project.',
  );
}

if (!isDeploymentMode && firebaseConfig.projectId === deploymentProjectId) {
  throw new Error(
    'Local development cannot connect to the shared staging/production Firebase project. Configure a separate development project instead.',
  );
}

const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
const storageBucket = `gs://${firebaseConfig.projectId}.firebasestorage.app`;

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp, storageBucket);

// Do not let an unavailable Storage backend leave image controls retrying for minutes.
firebaseStorage.maxOperationRetryTime = 5_000;
firebaseStorage.maxUploadRetryTime = 30_000;
