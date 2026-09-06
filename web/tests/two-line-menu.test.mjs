import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const menuIconSource = await readFile(new URL('../src/shared/ui/TwoLineMenuIcon.tsx', import.meta.url), 'utf8');
const filterIconSource = await readFile(new URL('../src/shared/ui/FilterIcon.tsx', import.meta.url), 'utf8');
const controlsSource = await readFile(new URL('../src/shared/ui/ManagementControls.tsx', import.meta.url), 'utf8');
const shellSource = await readFile(new URL('../src/core/app/ManagementShell.tsx', import.meta.url), 'utf8');
const adminShellSource = await readFile(new URL('../src/shared/ui/AdminShell.tsx', import.meta.url), 'utf8');
const sharedHeaderSource = await readFile(new URL('../src/shared/ui/Header.tsx', import.meta.url), 'utf8');
const portalSource = await readFile(new URL('../src/modules/portal/PortalShell.tsx', import.meta.url), 'utf8');
const publicContractCss = await readFile(new URL('../src/styles/public-portal-v2.css', import.meta.url), 'utf8');

test('two-line menu icon is reserved for shared navigation controls', () => {
  assert.match(menuIconSource, /viewBox="0 0 24 24"/);
  assert.match(menuIconSource, /strokeWidth="2"/);
  assert.match(menuIconSource, /x1="4" y1="8" x2="20" y2="8"/);
  assert.match(menuIconSource, /x1="4" y1="16" x2="20" y2="16"/);
  assert.match(shellSource, /<AdminShell/);
  assert.match(adminShellSource, /<Header/);
  assert.match(portalSource, /<Header/);
  assert.match(sharedHeaderSource, /<TwoLineMenuIcon\s*\/>/);
  assert.doesNotMatch(shellSource, /☰/);
  assert.doesNotMatch(portalSource, /☰/);
});

test('management filter trigger uses the Dos Hermanos funnel icon instead of navigation hamburger', () => {
  assert.match(filterIconSource, /polygon points="22 3 2 3 10 12\.46 10 19 14 21 14 12\.46 22 3"/);
  assert.match(controlsSource, /<FilterIcon\s*\/>/);
  assert.doesNotMatch(controlsSource, /<TwoLineMenuIcon\s*\/>/);
  assert.match(controlsSource, /aria-label="Filters and sorting"/);
});

test('mobile public account access is composed inside the shared Dos Hermanos navigation overlay', () => {
  assert.match(portalSource, /mobileMenuFooter=\{mobileMenuFooter\}/);
  assert.match(portalSource, /className="portal-mobile-account"/);
  assert.match(sharedHeaderSource, /mobileMenuFooter/);
  assert.match(publicContractCss, /\.navigation-overlay-footer \.portal-mobile-account/);
  assert.doesNotMatch(portalSource, /portal-mobile-navigation/);
});
