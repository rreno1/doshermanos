import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const portalShell = await readFile(new URL('../src/modules/portal/PortalShell.tsx', import.meta.url), 'utf8');
const portalCss = await readFile(new URL('../src/modules/portal/portal.css', import.meta.url), 'utf8');
const publicContract = await readFile(new URL('../src/modules/portal/public-portal-contract.css', import.meta.url), 'utf8');
const sharedHeader = await readFile(new URL('../src/shared/ui/Header.tsx', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../src/shared/ui/NavigationOverlay.tsx', import.meta.url), 'utf8');

test('public portal uses the same GSU header and navigation primitives as management', () => {
  assert.match(portalShell, /className="public-portal-header"/);
  assert.match(portalShell, /theme="light"/);
  assert.match(portalShell, /items=\{navigationItems\}/);
  assert.match(portalShell, /desktopActions=\{desktopActions\}/);
  assert.match(portalShell, /mobileMenuFooter=\{mobileMenuFooter\}/);
  assert.match(portalShell, /public-view portal-shell/);
  assert.doesNotMatch(portalShell, /useState\(/);
  assert.doesNotMatch(portalShell, /portal-menu-button/);
});

test('public content CSS no longer carries the replaced custom header and mobile menu system', () => {
  assert.doesNotMatch(portalCss, /\.portal-header\b/);
  assert.doesNotMatch(portalCss, /\.portal-navigation\b/);
  assert.doesNotMatch(portalCss, /\.portal-menu-button\b/);
  assert.doesNotMatch(portalCss, /\.portal-mobile-navigation\b/);
  assert.doesNotMatch(portalCss, /border-radius:\s*(?:18|22)px/);
});

test('public portal foundation follows the current GSU contract', () => {
  assert.match(publicContract, /--portal-ink:\s*#153a31/);
  assert.match(publicContract, /--portal-green:\s*#1f6b57/);
  assert.match(publicContract, /--portal-hero-space:\s*clamp\(56px, 4\.5vw, 68px\)/);
  assert.match(publicContract, /background:\s*#f4f7f5/);
  assert.match(publicContract, /padding-block:\s*var\(--portal-hero-space\)/);
  assert.match(publicContract, /--app-header-height:\s*76px/);
  assert.match(publicContract, /border-top:\s*3px solid var\(--portal-green\)/);
  assert.match(publicContract, /backdrop-filter:\s*saturate\(1\.1\) blur\(18px\)/);
  assert.match(publicContract, /primary-nav-horizontal \.primary-nav-item::after/);
  assert.match(publicContract, /border-radius:\s*8px/);
  assert.match(publicContract, /border-radius:\s*12px !important/);
  assert.match(publicContract, /prefers-reduced-motion:\s*reduce/);
});

test('shared mobile navigation remains body-portalled and focus managed for public and admin shells', () => {
  assert.match(sharedHeader, /<NavigationOverlay/);
  assert.match(overlay, /createPortal/);
  assert.match(overlay, /document\.body/);
  assert.match(overlay, /aria-modal="true"/);
  assert.match(overlay, /event\.key === 'Escape'/);
  assert.match(overlay, /event\.key !== 'Tab'/);
  assert.match(overlay, /footer \? <div className="navigation-overlay-footer">/);
});
