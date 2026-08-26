import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const inactivitySource = await readFile(
  new URL('../src/features/auth/session-inactivity.ts', import.meta.url),
  'utf8',
);
const authProviderSource = await readFile(
  new URL('../src/features/auth/AuthProvider.tsx', import.meta.url),
  'utf8',
);
const authServiceSource = await readFile(
  new URL('../src/features/auth/auth.service.ts', import.meta.url),
  'utf8',
);

test('session inactivity uses elapsed wall-clock time instead of timer progress alone', () => {
  assert.match(inactivitySource, /SESSION_IDLE_TIMEOUT_MS = 30 \* 60 \* 1000/);
  assert.match(inactivitySource, /Date\.now\(\) - lastActivity >= timeoutMs/);
  assert.match(inactivitySource, /localStorage\.setItem/);
  assert.match(inactivitySource, /localStorage\.getItem/);
});

test('session expiration is rechecked when a suspended browser resumes', () => {
  assert.match(inactivitySource, /addEventListener\('focus', checkAfterResume\)/);
  assert.match(inactivitySource, /addEventListener\('pageshow', checkAfterResume\)/);
  assert.match(inactivitySource, /visibilitychange/);
  assert.match(inactivitySource, /document\.visibilityState === 'visible'/);
  assert.match(inactivitySource, /if \(expireIfNeeded\(\)\) return/);
});

test('authentication lifecycle starts and clears the inactivity clock', () => {
  assert.match(authProviderSource, /useSessionInactivity/);
  assert.match(authServiceSource, /markSessionActivity\(\)/);
  assert.match(authServiceSource, /clearSessionActivity\(\)/);
});
