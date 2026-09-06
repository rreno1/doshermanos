import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [
  managementShellSource,
  sharedAdminShellSource,
  overlaySource,
  tokenSource,
  adminShellCss,
  uiSource,
  responsiveSource,
  presentationSource,
  formSource,
  tableSource,
  modalSource,
  tabsSource,
] = await Promise.all([
  readFile(new URL('../src/core/app/ManagementShell.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/shared/ui/AdminShell.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/shared/ui/NavigationOverlay.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/tokens.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/admin-shell.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/ui-consistency.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/responsive-contract.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/presentation-contract.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/form-contract.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/table-behavior.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/modal-behavior.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/shared/ui/Tabs.tsx', import.meta.url), 'utf8'),
]);

test('management workspace composes the canonical shared Dos Hermanos AdminShell', () => {
  assert.match(managementShellSource, /import \{ AdminShell \} from '@shared\/ui\/AdminShell'/);
  assert.match(managementShellSource, /<AdminShell/);
  assert.match(managementShellSource, /mainId="main-content"/);
  assert.doesNotMatch(managementShellSource, /<aside className="sidebar"/);
  assert.doesNotMatch(managementShellSource, /management-sidebar-open/);
  assert.doesNotMatch(managementShellSource, /management-sidebar-backdrop/);

  for (const requiredClass of [
    'admin-view',
    'admin-mobile-header',
    'admin-grid',
    'sidebar',
    'sidebar-primary-navigation',
    'sidebar-account-menu',
    'admin-main',
  ]) {
    assert.match(sharedAdminShellSource, new RegExp(requiredClass));
  }

  assert.match(sharedAdminShellSource, /<Header/);
  assert.match(sharedAdminShellSource, /<AppBrand/);
  assert.match(sharedAdminShellSource, /<PrimaryNavigation/);
  assert.match(sharedAdminShellSource, /<AccountMenu/);
  assert.match(sharedAdminShellSource, /<PageHeader/);
  assert.match(managementShellSource, /admin-page-stage/);
});

test('Dos Hermanos geometry and control-size tokens are locked', () => {
  assert.match(tokenSource, /--radius-sm:\s*6px/);
  assert.match(tokenSource, /--radius-md:\s*8px/);
  assert.match(tokenSource, /--radius-lg:\s*10px/);
  assert.match(tokenSource, /--ui-compact-control-size:\s*36px/);
  assert.match(tokenSource, /--ui-toolbar-control-size:\s*40px/);
  assert.match(tokenSource, /--ui-form-control-height:\s*42px/);
  assert.match(adminShellCss, /width:\s*248px/);
  assert.match(adminShellCss, /margin-left:\s*248px/);
});

test('mobile navigation follows the Dos Hermanos viewport overlay contract', () => {
  assert.match(overlaySource, /createPortal/);
  assert.match(overlaySource, /document\.body/);
  assert.match(overlaySource, /getBoundingClientRect\(\)\.bottom/);
  assert.match(overlaySource, /aria-modal="true"/);
  assert.match(overlaySource, /event\.key === 'Escape'/);
  assert.match(overlaySource, /event\.key !== 'Tab'/);
  assert.match(overlaySource, /root\.style\.overflow = 'hidden'/);
  assert.match(overlaySource, /previousBodyPaddingRight/);
  assert.match(overlaySource, /min-width: 901px/);
  assert.match(uiSource, /\.navigation-overlay-backdrop/);
  assert.match(responsiveSource, /\.admin-grid \.sidebar \{ display: none !important; \}/);
});

test('feature surfaces and controls follow the Dos Hermanos presentation contracts', () => {
  assert.match(presentationSource, /--management-radius:\s*var\(--radius-lg\)/);
  assert.match(presentationSource, /--management-control-height:\s*var\(--ui-form-control-height\)/);
  assert.match(presentationSource, /--management-tab-content-gap:\s*12px/);
  assert.match(presentationSource, /height:\s*var\(--ui-toolbar-control-size\) !important/);
  assert.match(presentationSource, /\.package-card/);

  assert.match(formSource, /min-height:\s*var\(--ui-form-control-height\)/);
  assert.match(formSource, /grid-template-columns:\s*minmax\(0, 1fr\) !important/);
  assert.match(tableSource, /min-height:\s*var\(--ui-compact-control-size\)/);
  assert.match(tableSource, /\.col-primary/);
  assert.match(tableSource, /\.col-status/);
  assert.match(tableSource, /\.col-actions/);
  assert.match(tableSource, /@media \(max-width: 620px\)[\s\S]*\.management-table thead/);
  assert.match(modalSource, /dialog\.inventory-dialog/);
  assert.match(modalSource, /position:\s*sticky/);
  assert.match(tabsSource, /event\.key === 'ArrowRight'/);
  assert.match(tabsSource, /tab-label-mobile/);
});
