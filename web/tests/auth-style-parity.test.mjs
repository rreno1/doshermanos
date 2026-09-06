import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [authCss, modalCss, authMenu, authForm] = await Promise.all([
  readFile(new URL('../src/styles/auth.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/modal-behavior.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/auth/AuthMenu.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/auth/AuthForm.tsx', import.meta.url), 'utf8'),
]);

test('authentication dialog uses the shared Dos Hermanos modal contract', () => {
  assert.match(authMenu, /className="auth-dialog"/);
  assert.match(modalCss, /dialog\.auth-dialog/);
  assert.doesNotMatch(authCss, /::backdrop/);
  assert.doesNotMatch(authCss, /border-radius:\s*(?:14|20|22|26|28)px/);
  assert.doesNotMatch(authCss, /box-shadow:\s*0 28px 90px/);
});

test('authentication controls use Dos Hermanos geometry focus and motion tokens', () => {
  assert.match(authCss, /min-height:\s*var\(--ui-toolbar-control-size\)/);
  assert.match(authCss, /border-radius:\s*var\(--radius-md\)/);
  assert.match(authCss, /outline:\s*var\(--ui-focus-outline\)/);
  assert.match(authCss, /var\(--motion-fast\)/);
  assert.match(authCss, /var\(--motion-standard\)/);
  assert.match(authCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(authCss, /border-radius:\s*999px/);
});

test('Google authentication remains Google-provided identity with Firebase handling copy', () => {
  assert.match(authForm, /GoogleLogo/);
  assert.match(authForm, /Continue with Google/);
  assert.match(authForm, /Firebase Authentication/);
  assert.match(authCss, /\.auth-google-button/);
  assert.match(authCss, /min-height:\s*46px/);
});
