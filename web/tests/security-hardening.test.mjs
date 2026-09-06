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
] = await Promise.all([
  readFile(new URL('../src/modules/auth/auth-security.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/auth/AuthProvider.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/auth/auth.service.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/users/users.service.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/payments/PaymentRecordDialog.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/core/firebase/firebase.ts', import.meta.url), 'utf8'),
  readFile(new URL('../.env.staging.example', import.meta.url), 'utf8'),
  readFile(new URL('../.env.production.example', import.meta.url), 'utf8'),
]);

test('authenticated sessions accept only verified Google identities', () => {
  assert.match(authSecurity, /user\.emailVerified/);
  assert.match(authSecurity, /!user\.isAnonymous/);
  assert.match(authSecurity, /provider\.providerId === 'google\.com'/);
  assert.match(authService, /isTrustedGoogleUser\(credential\.user\)/);
  assert.match(authProvider, /isTrustedGoogleUser\(user\)/);
  assert.match(authProvider, /closeRejectedSession/);
});

test('privileged roles use tab-scoped Firebase Auth persistence', () => {
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
