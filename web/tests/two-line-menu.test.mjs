import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const menuIconSource = await readFile(new URL('../src/shared/ui/TwoLineMenuIcon.tsx', import.meta.url), 'utf8');
const filterIconSource = await readFile(new URL('../src/shared/ui/FilterIcon.tsx', import.meta.url), 'utf8');
const controlsSource = await readFile(new URL('../src/shared/ui/ManagementControls.tsx', import.meta.url), 'utf8');
const shellSource = await readFile(new URL('../src/core/app/ManagementShell.tsx', import.meta.url), 'utf8');
const sharedHeaderSource = await readFile(new URL('../src/shared/ui/Header.tsx', import.meta.url), 'utf8');
const portalSource = await readFile(new URL('../src/modules/portal/PortalShell.tsx', import.meta.url), 'utf8');
const publicContractCss = await readFile(new URL('../src/modules/portal/public-portal-contract.css', import.meta.url), 'utf8');

test('two-line menu icon is reserved for shared navigation controls', () => {
  assert.match(menuIconSource, /M4 7h12M4 13h12/);
  assert.match(shellSource, /<Header/);
  assert.match(portalSource, /<Header/);
  assert.match(sharedHeaderSource, /<TwoLineMenuIcon\s*\/>/);
  assert.doesNotMatch(shellSource, /☰/);
  assert.doesNotMatch(portalSource, /☰/);
});

test('management filter trigger uses a semantic filter icon instead of navigation hamburger', () => {
  assert.match(filterIconSource, /M3 5h14M6 10h8M8 15h4/);
  assert.match(controlsSource, /<FilterIcon\s*\/>/);
  assert.doesNotMatch(controlsSource, /<TwoLineMenuIcon\s*\/>/);
  assert.match(controlsSource, /aria-label="Filters and sorting"/);
});

test('mobile public account access is composed inside the shared GSU navigation overlay', () => {
  assert.match(portalSource, /mobileMenuFooter=\{mobileMenuFooter\}/);
  assert.match(portalSource, /className="portal-mobile-account"/);
  assert.match(sharedHeaderSource, /mobileMenuFooter/);
  assert.match(publicContractCss, /\.navigation-overlay-footer \.portal-mobile-account/);
  assert.doesNotMatch(portalSource, /portal-mobile-navigation/);
});
