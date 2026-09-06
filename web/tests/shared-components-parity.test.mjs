import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sharedComponents = await readFile(new URL('../src/styles/shared-components.css', import.meta.url), 'utf8');

test('shared-components owns canonical GSU primitives instead of the retired management visual system', () => {
  for (const legacySelector of [
    '.management-shell',
    '.management-topbar',
    '.management-content',
    '.inventory-summary-value',
    '.equipment-summary-value',
    '.package-management-table',
    '.users-table',
    '.report-table',
    '.inventory-main-column',
    '.payments-main-column',
    '.equipment-column',
    '.reservation-review-row',
    '.reports-controls',
    '.audit-entry',
  ]) {
    assert.doesNotMatch(sharedComponents, new RegExp(legacySelector.replace('.', '\\.')));
  }
});

test('shared-components keeps the canonical GSU surface and utility language', () => {
  assert.match(sharedComponents, /\.status\s*\{/);
  assert.match(sharedComponents, /\.tag-badge\s*\{/);
  assert.match(sharedComponents, /\.panel\s*\{/);
  assert.match(sharedComponents, /\.table-wrap\s*\{/);
  assert.match(sharedComponents, /\.row-actions\s*\{/);
  assert.match(sharedComponents, /\.mini-btn\s*,/);
  assert.match(sharedComponents, /\.list-toolbar-wrap\s*\{/);
  assert.match(sharedComponents, /\.detail-section-content\s*\{/);
  assert.match(sharedComponents, /border-radius:\s*var\(--radius-lg\)/);
  assert.match(sharedComponents, /background:\s*var\(--surface-translucent\)/);
  assert.match(sharedComponents, /box-shadow:\s*var\(--shadow-sm\)/);
});
