import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const reviewPanelPath = new URL(
  '../src/features/operations/ReservationReviewPanel.tsx',
  import.meta.url,
);
const operationsPanelPath = new URL(
  '../src/features/operations/OperationsPanel.tsx',
  import.meta.url,
);

test('staff reservation review keeps confirmation disabled until capacity rules are approved', async () => {
  const source = await readFile(reviewPanelPath, 'utf8');

  assert.match(source, /title="Confirmation requires approved capacity and customization rules"/);
  assert.match(source, /disabled[\s\S]*?>[\s\S]*?Confirm/);
  assert.match(source, /Reject/);
  assert.match(source, /event-capacity and customization-pricing rules/i);
  assert.doesNotMatch(source, /confirmReservation\s*\(/);
});

test('operations keeps manual reservation first and package management in the same module', async () => {
  const source = await readFile(operationsPanelPath, 'utf8');
  const manualIndex = source.indexOf("{ value: 'manual', label: 'Manual reservation' }");
  const pendingIndex = source.indexOf("{ value: 'pending', label: 'Pending requests' }");
  const packageIndex = source.indexOf("{ value: 'packages', label: 'Manage Packages' }");

  assert.ok(manualIndex >= 0);
  assert.ok(pendingIndex > manualIndex);
  assert.ok(packageIndex > pendingIndex);
  assert.match(source, /useState<OperationsTab>\('manual'\)/);
  assert.match(source, /<ManualReservationPanel/);
  assert.match(source, /<ReservationReviewPanel/);
  assert.match(source, /<PackageManagementPanel/);
});
