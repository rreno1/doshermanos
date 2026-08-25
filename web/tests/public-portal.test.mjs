import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../src/app/App.tsx', import.meta.url), 'utf8');
const shellSource = await readFile(new URL('../src/features/portal/PortalShell.tsx', import.meta.url), 'utf8');
const portalSource = await readFile(new URL('../src/features/portal/PublicPortal.tsx', import.meta.url), 'utf8');
const landingSource = await readFile(new URL('../src/features/portal/LandingPage.tsx', import.meta.url), 'utf8');

test('signed-out visitors are restricted to the landing route', () => {
  assert.match(appSource, /status !== 'active' \|\| !profile/);
  assert.match(portalSource, /status === 'signed_out'/);
  assert.match(portalSource, /<LandingPage \/>/);
});

test('active customers receive routed portal pages', () => {
  assert.match(appSource, /pathname === '\/packages'/);
  assert.match(appSource, /pathname === '\/reservations'/);
  assert.match(appSource, /pathname === '\/payments'/);
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
