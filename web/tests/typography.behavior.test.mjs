import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const shellPath = new URL('../src/core/app/ManagementShell.tsx', import.meta.url);
const typographyPath = new URL('../src/styles/typography.css', import.meta.url);
const foundationPath = new URL('../src/styles/foundation.css', import.meta.url);
const controlSystemPath = new URL('../src/styles/control-system.css', import.meta.url);

test('management sidebar excludes the public portal shortcut', async () => {
  const source = await readFile(shellPath, 'utf8');

  assert.doesNotMatch(source, /Public portal/);
  assert.doesNotMatch(source, /management-public-navigation/);
});

test('navigation and placeholders use the regular text weight', async () => {
  const source = await readFile(typographyPath, 'utf8');

  assert.match(source, /\.management-navigation-link,[\s\S]*?font-weight:\s*var\(--font-weight-regular\)\s*!important/);
  assert.match(source, /input::placeholder,[\s\S]*?textarea::placeholder[\s\S]*?font-weight:\s*var\(--font-weight-regular\)\s*!important/);
});

test('application and management spinners keep rotating', async () => {
  const [foundationSource, controlSystemSource] = await Promise.all([
    readFile(foundationPath, 'utf8'),
    readFile(controlSystemPath, 'utf8'),
  ]);

  assert.match(foundationSource, /animation:\s*app-loading-spin\s+720ms\s+linear\s+infinite\s*!important/);
  assert.match(controlSystemSource, /animation:\s*management-spinner-rotate\s+720ms\s+linear\s+infinite/);
});
