import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const reviewPanelPath = new URL(
  '../src/features/reservations/ReservationReviewPanel.tsx',
  import.meta.url,
);

test('staff reservation review keeps confirmation disabled until capacity rules are approved', async () => {
  const source = await readFile(reviewPanelPath, 'utf8');

  assert.match(source, /Confirm unavailable/);
  assert.match(source, /Reject request/);
  assert.match(source, /confirmation remains intentionally gated/i);
  assert.match(source, /overlapping events/i);
  assert.doesNotMatch(source, /confirmReservation\s*\(/);
});
