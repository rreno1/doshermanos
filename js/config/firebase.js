/**
 * Dos Hermanos Catering System — Firebase Configuration Boundary
 * Initialized with standard Firebase ES modules via CDN.
 */

// Firebase Public Configuration Boundary
export const firebaseConfig = {
  apiKey: "DEMO_FIREBASE_API_KEY",
  authDomain: "dos-hermanos-catering.firebaseapp.com",
  projectId: "dos-hermanos-catering",
  storageBucket: "dos-hermanos-catering.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Flag to check if Firebase is configured with real credentials
export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "DEMO_FIREBASE_API_KEY";
}

/**
 * Initializes Firebase App and Auth boundaries safely.
 */
export async function initializeFirebaseBoundary() {
  if (!isFirebaseConfigured()) {
    console.warn("Dos Hermanos PWA: Operating in Local Demo / Mock Mode (Firebase keys not replaced yet).");
    return { isDemo: true };
  }
  
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    const { getAuth, GoogleAuthProvider, FacebookAuthProvider } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();
    const facebookProvider = new FacebookAuthProvider();

    return { isDemo: false, app, auth, googleProvider, facebookProvider };
  } catch (error) {
    console.error("Failed to initialize Firebase SDK:", error);
    return { isDemo: true, error };
  }
}
