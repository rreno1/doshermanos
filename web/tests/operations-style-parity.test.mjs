import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [
  manualCss,
  packageCss,
  reservationCss,
  modalCss,
  reviewSource,
] = await Promise.all([
  readFile(new URL('../src/modules/operations/manual-reservation.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/operations/package-management.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/operations/reservations.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/modal-behavior.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/operations/ReservationReviewPanel.tsx', import.meta.url), 'utf8'),
]);

test('operations dialogs inherit the shared Dos Hermanos modal contract', () => {
  assert.match(modalCss, /dialog\.package-management-dialog/);
  assert.match(modalCss, /dialog\.reservation-dialog/);
  assert.match(modalCss, /border-radius:\s*var\(--radius-lg\)/);
  assert.match(modalCss, /background:\s*var\(--surface-raised\)/);
  assert.match(modalCss, /\.package-management-editor-actions/);

  assert.doesNotMatch(packageCss, /border-radius:\s*(?:20|24|28)px/);
  assert.doesNotMatch(reservationCss, /border-radius:\s*(?:20|24|28)px/);
});

test('operations action buttons use Dos Hermanos control radii instead of pill styling', () => {
  assert.match(packageCss, /--ui-toolbar-control-size/);
  assert.match(packageCss, /border-radius:\s*var\(--radius-md\)/);
  assert.match(reservationCss, /min-height:\s*var\(--ui-toolbar-control-size\)/);
  assert.match(reservationCss, /border-radius:\s*var\(--radius-md\)/);

  assert.doesNotMatch(packageCss, /border-radius:\s*999px/);
  assert.doesNotMatch(reservationCss, /(?:package-action|primary-button|quiet-button)[\s\S]{0,500}border-radius:\s*999px/);
});

test('package management no longer carries a parallel table and status system', () => {
  assert.doesNotMatch(packageCss, /\.package-management-table\b/);
  assert.doesNotMatch(packageCss, /\.package-management-table-wrap\b/);
  assert.doesNotMatch(packageCss, /\.package-management-summary\b/);
  assert.doesNotMatch(packageCss, /\.package-management-status\b/);
});

test('pending reservation review is composed from shared management primitives', () => {
  assert.match(reviewSource, /<ManagementToolbar/);
  assert.match(reviewSource, /<ManagementTableFrame/);
  assert.match(reviewSource, /className="management-table"/);
  assert.match(reviewSource, /management-status-badge/);

  assert.doesNotMatch(reservationCss, /\.reservation-review-row\b/);
  assert.doesNotMatch(reservationCss, /\.reservation-review-count\b/);
  assert.doesNotMatch(reservationCss, /\.reservation-review-actions\b/);
  assert.match(reservationCss, /\.reservation-review-section/);
});

test('manual reservation surfaces use canonical tokens instead of a separate visual palette', () => {
  assert.match(manualCss, /var\(--surface-raised\)/);
  assert.match(manualCss, /var\(--radius-lg\)/);
  assert.match(manualCss, /var\(--primary-light\)/);
  assert.doesNotMatch(manualCss, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(manualCss, /border-radius:\s*(?:12|14|20|24|28)px/);
});
