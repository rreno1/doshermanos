import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [
  authSecurity,
  authProvider,
  authService,
  usersService,
  paymentDialog,
  firebaseCore,
  stagingEnv,
  productionEnv,
  hostingConfig,
] = await Promise.all([
  readFile(new URL('../src/modules/auth/auth-security.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/auth/AuthProvider.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/auth/auth.service.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/users/users.service.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/payments/PaymentRecordDialog.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/core/firebase/firebase.ts', import.meta.url), 'utf8'),
  readFile(new URL('../.env.staging.example', import.meta.url), 'utf8'),
  readFile(new URL('../.env.production.example', import.meta.url), 'utf8'),
  readFile(new URL('../../firebase.json', import.meta.url), 'utf8'),
]);

test('authenticated sessions accept only verified Google identities', () => {
  assert.match(authSecurity, /user\.emailVerified/);
  assert.match(authSecurity, /!user\.isAnonymous/);
  assert.match(authSecurity, /provider\.providerId === 'google\.com'/);
  assert.match(authService, /isTrustedGoogleUser\(credential\.user\)/);
  assert.match(authProvider, /isTrustedGoogleUser\(user\)/);
  assert.match(authProvider, /closeRejectedSession/);
});

test('Firebase Auth starts session-first and only verified customers gain durable persistence', () => {
  assert.match(firebaseCore, /initializeAuth\(firebaseApp/);
  assert.match(
    firebaseCore,
    /persistence:\s*\[browserSessionPersistence, browserLocalPersistence\]/,
  );
  assert.match(firebaseCore, /popupRedirectResolver:\s*browserPopupRedirectResolver/);
  assert.doesNotMatch(firebaseCore, /getAuth\(firebaseApp\)/);

  assert.match(authSecurity, /role === 'admin' \|\| role === 'staff'/);
  assert.match(authSecurity, /browserSessionPersistence/);
  assert.match(authSecurity, /browserLocalPersistence/);
  assert.match(authSecurity, /setPersistence\(firebaseAuth, persistence\)/);
  assert.match(authProvider, /applyRoleAuthPersistence\(profile\.role\)/);
});

test('authorization changes and cash recording require recent Google authentication', () => {
  assert.match(authSecurity, /10 \* 60 \* 1000/);
  assert.match(authSecurity, /getIdTokenResult\(user\)/);
  assert.match(authSecurity, /reauthenticateWithPopup\(user, provider\)/);

  const userStepUp = usersService.indexOf('await ensureRecentGoogleAuthentication();');
  const userWrite = usersService.indexOf("await updateDoc(doc(firestore, 'users', userId)");
  assert.ok(userStepUp >= 0 && userWrite > userStepUp);

  const paymentStepUp = paymentDialog.indexOf('await ensureRecentGoogleAuthentication();');
  const paymentWrite = paymentDialog.indexOf('await recordCashPayment(');
  assert.ok(paymentStepUp >= 0 && paymentWrite > paymentStepUp);
});

test('deployment builds support Firebase App Check with reCAPTCHA Enterprise', () => {
  assert.match(firebaseCore, /ReCaptchaEnterpriseProvider/);
  assert.match(firebaseCore, /initializeAppCheck/);
  assert.match(firebaseCore, /isDeploymentMode && appCheckSiteKey/);
  assert.match(firebaseCore, /isTokenAutoRefreshEnabled:\s*true/);
  assert.doesNotMatch(firebaseCore, /APPCHECK_DEBUG_TOKEN/);
  assert.match(stagingEnv, /VITE_FIREBASE_APP_CHECK_SITE_KEY=/);
  assert.match(productionEnv, /VITE_FIREBASE_APP_CHECK_SITE_KEY=/);
});

test('hosting policy permits App Check endpoints without weakening isolation', () => {
  assert.match(hostingConfig, /https:\/\/www\.google\.com\/recaptcha\//);
  assert.match(hostingConfig, /https:\/\/www\.gstatic\.com\/recaptcha\//);
  assert.match(hostingConfig, /https:\/\/recaptcha\.google\.com\/recaptcha\//);
  assert.match(hostingConfig, /Cross-Origin-Opener-Policy/);
  assert.match(hostingConfig, /same-origin-allow-popups/);
  assert.match(hostingConfig, /Cross-Origin-Resource-Policy/);
  assert.match(hostingConfig, /upgrade-insecure-requests/);
});
