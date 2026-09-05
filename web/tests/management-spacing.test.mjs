import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const styleIndexPath = new URL('../src/styles/index.css', import.meta.url);
const spacingPath = new URL('../src/styles/management-spacing.css', import.meta.url);

test('management tabs use one shared gap before summary and controls', async () => {
  const [styleIndexSource, spacingSource] = await Promise.all([
    readFile(styleIndexPath, 'utf8'),
    readFile(spacingPath, 'utf8'),
  ]);

  assert.match(styleIndexSource, /@import '\.\/management-spacing\.css';/);
  assert.match(spacingSource, /--management-tab-content-gap:\s*20px/);
  assert.match(spacingSource, /--management-section-stack-gap:\s*12px/);
  assert.match(spacingSource, /\.management-page > \.operations-section > \.management-tabs/);
  assert.match(spacingSource, /\.management-page > \.resources-section > \.management-tabs/);
  assert.match(spacingSource, /\.management-page > \.payments-section > \.management-tabs/);
  assert.match(spacingSource, /\.management-page > \.reports-section > \.management-tabs/);
  assert.match(spacingSource, /\.management-page > \.users-section > \.management-tabs/);
  assert.match(spacingSource, /\.management-page > \.audit-section > \.management-tabs/);
  assert.match(spacingSource, /\.management-page > \.operations-section > \.reservation-review-section/);
  assert.match(spacingSource, /\.management-page > \.resources-section > \.inventory-section/);
});
