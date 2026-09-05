import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const menuIconSource = await readFile(new URL('../src/app/TwoLineMenuIcon.tsx', import.meta.url), 'utf8');
const controlsSource = await readFile(new URL('../src/app/ManagementControls.tsx', import.meta.url), 'utf8');
const shellSource = await readFile(new URL('../src/app/ManagementShell.tsx', import.meta.url), 'utf8');
const sharedHeaderSource = await readFile(new URL('../src/app/gsu-ui/Header.tsx', import.meta.url), 'utf8');
const portalSource = await readFile(new URL('../src/features/portal/PortalShell.tsx', import.meta.url), 'utf8');
const publicContractCss = await readFile(new URL('../src/features/portal/public-portal-contract.css', import.meta.url), 'utf8');

test('two-line menu icon is shared by GSU management and public header controls', () => {
  assert.match(menuIconSource, /M4 7h12M4 13h12/);
  assert.match(controlsSource, /<TwoLineMenuIcon\s*\/>/);
  assert.match(shellSource, /<Header/);
  assert.match(portalSource, /<Header/);
  assert.match(sharedHeaderSource, /<TwoLineMenuIcon\s*\/>/);
  assert.doesNotMatch(shellSource, /☰/);
  assert.doesNotMatch(portalSource, /☰/);
});

test('mobile public account access is composed inside the shared GSU navigation overlay', () => {
  assert.match(portalSource, /mobileMenuFooter=\{mobileMenuFooter\}/);
  assert.match(portalSource, /className="portal-mobile-account"/);
  assert.match(sharedHeaderSource, /mobileMenuFooter/);
  assert.match(publicContractCss, /\.navigation-overlay-footer \.portal-mobile-account/);
  assert.doesNotMatch(portalSource, /portal-mobile-navigation/);
});
