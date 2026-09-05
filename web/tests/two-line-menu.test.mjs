import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const menuIconSource = await readFile(new URL('../src/app/TwoLineMenuIcon.tsx', import.meta.url), 'utf8');
const controlsSource = await readFile(new URL('../src/app/ManagementControls.tsx', import.meta.url), 'utf8');
const shellSource = await readFile(new URL('../src/app/ManagementShell.tsx', import.meta.url), 'utf8');
const sharedHeaderSource = await readFile(new URL('../src/app/gsu-ui/Header.tsx', import.meta.url), 'utf8');
const portalSource = await readFile(new URL('../src/features/portal/PortalShell.tsx', import.meta.url), 'utf8');
const portalCss = await readFile(new URL('../src/features/portal/portal.css', import.meta.url), 'utf8');

test('two-line menu icon is shared by management and portal controls', () => {
  assert.match(menuIconSource, /M4 7h12M4 13h12/);
  assert.match(controlsSource, /<TwoLineMenuIcon\s*\/>/);
  assert.match(shellSource, /<Header/);
  assert.match(sharedHeaderSource, /<TwoLineMenuIcon\s*\/>/);
  assert.match(portalSource, /<TwoLineMenuIcon\s*\/>/);
  assert.doesNotMatch(shellSource, /☰/);
});

test('mobile portal keeps account access inside the menu', () => {
  assert.match(portalSource, /className="portal-mobile-account"/);
  assert.match(portalSource, /<div className="portal-mobile-account">\s*<AuthMenu \/>/);
  assert.match(portalCss, /\.portal-navigation,\s*\.portal-header-actions\s*\{\s*display:\s*none;/);
  assert.match(portalCss, /\.portal-mobile-account \.auth-trigger/);
});
