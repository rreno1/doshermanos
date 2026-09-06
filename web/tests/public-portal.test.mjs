import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const navigationSource = await readFile(new URL('../src/core/app/nav.ts', import.meta.url), 'utf8');
const shellSource = await readFile(new URL('../src/modules/portal/PortalShell.tsx', import.meta.url), 'utf8');
const portalSource = await readFile(new URL('../src/modules/portal/PublicPortal.tsx', import.meta.url), 'utf8');
const landingSource = await readFile(new URL('../src/modules/portal/LandingPage.tsx', import.meta.url), 'utf8');

test('signed-out visitors are restricted to the landing route', () => {
  assert.match(navigationSource, /status !== 'active' \|\| !role/);
  assert.match(appSource, /isAllowedPublicPath/);
  assert.match(portalSource, /status === 'signed_out'/);
  assert.match(portalSource, /<LandingPage \/>/);
});

test('active customers receive routed portal pages', () => {
  assert.match(navigationSource, /pathname === '\/packages'/);
  assert.match(navigationSource, /pathname === '\/reservations'/);
  assert.match(navigationSource, /pathname === '\/payments'/);
  assert.match(shellSource, /My Reservations/);
  assert.match(shellSource, /Payments/);
});

test('staff and administrators receive a workspace return action', () => {
  assert.match(shellSource, />\s*Workspace\s*</);
  assert.match(shellSource, /workspaceRole === 'admin' \? '\/admin' : '\/staff'/);
});

test('landing page stays marketing-focused instead of rendering account history', () => {
  assert.match(landingSource, /Featured packages/);
  assert.match(landingSource, /How it works/);
  assert.doesNotMatch(landingSource, /MyReservations/);
  assert.doesNotMatch(landingSource, /MyPayments/);
});
