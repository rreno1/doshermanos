import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [
  authSecurity,
  authProvider,
  authService,
  usersService,
  auditService,
  packageService,
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
  readFile(new URL('../src/modules/audit/audit.service.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/operations/package.service.ts', import.meta.url), 'utf8'),
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

test('sensitive management writes require recent Google authentication before persistence', () => {
  assert.match(authSecurity, /10 \* 60 \* 1000/);
  assert.match(authSecurity, /getIdTokenResult\(user\)/);
  assert.match(authSecurity, /reauthenticateWithPopup\(user, provider\)/);

  const userStepUp = usersService.indexOf('await ensureRecentGoogleAuthentication();');
  const userTransaction = usersService.indexOf('await runTransaction(');
  assert.ok(userStepUp >= 0 && userTransaction > userStepUp);

  const paymentStepUp = paymentDialog.indexOf('await ensureRecentGoogleAuthentication();');
  const paymentWrite = paymentDialog.indexOf('await recordCashPayment(');
  assert.ok(paymentStepUp >= 0 && paymentWrite > paymentStepUp);

  for (const functionName of [
    'createManagedPackage',
    'updateManagedPackage',
    'setManagedPackageActive',
  ]) {
    const functionStart = packageService.indexOf(`function ${functionName}`);
    const nextFunctionStart = packageService.indexOf('\nexport async function ', functionStart + 1);
    const functionSource = packageService.slice(
      functionStart,
      nextFunctionStart === -1 ? packageService.length : nextFunctionStart,
    );
    const stepUp = functionSource.indexOf('await ensureRecentGoogleAuthentication();');
    const firestoreWrite = Math.max(
      functionSource.indexOf('await addDoc('),
      functionSource.indexOf('await updateDoc('),
    );
    assert.ok(functionStart >= 0 && stepUp >= 0 && firestoreWrite > stepUp, `${functionName} must step up before writing.`);
  }
});

test('administrator access changes are transactionally coupled to immutable audit activity', () => {
  assert.match(usersService, /collection\(firestore, 'userAccessEvents'\)/);
  assert.match(usersService, /lastAccessEventId:\s*eventRef\.id/);
  assert.match(usersService, /previousRole:\s*current\.role/);
  assert.match(usersService, /newRole:\s*role/);
  assert.match(usersService, /previousStatus:\s*current\.status/);
  assert.match(usersService, /newStatus:\s*status/);
  assert.match(usersService, /changedBy:\s*actor\.id/);
  assert.match(usersService, /changedByName:\s*actor\.displayName/);
  assert.match(usersService, /transaction\.update\(userRef/);
  assert.match(usersService, /transaction\.set\(eventRef/);
  assert.match(auditService, /subscribeToRecentUserAccessEvents/);
  assert.match(auditService, /kind:\s*'access_changed'/);
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
