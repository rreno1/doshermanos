import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const styleIndexPath = new URL('../src/styles/index.css', import.meta.url);
const presentationPath = new URL('../src/styles/presentation-contract.css', import.meta.url);

test('management tabs use one shared gap before summary and controls', async () => {
  const [styleIndexSource, presentationSource] = await Promise.all([
    readFile(styleIndexPath, 'utf8'),
    readFile(presentationPath, 'utf8'),
  ]);

  assert.match(styleIndexSource, /@import '\.\/presentation-contract\.css';/);
  assert.doesNotMatch(styleIndexSource, /management-spacing\.css/);
  assert.match(presentationSource, /--management-tab-content-gap:\s*20px/);
  assert.match(presentationSource, /--management-section-stack-gap:\s*12px/);
  assert.match(presentationSource, /\.management-page > \.operations-section > \.management-tabs/);
  assert.match(presentationSource, /\.management-page > \.resources-section > \.management-tabs/);
  assert.match(presentationSource, /\.management-page > \.payments-section > \.management-tabs/);
  assert.match(presentationSource, /\.management-page > \.reports-section > \.management-tabs/);
  assert.match(presentationSource, /\.management-page > \.users-section > \.management-tabs/);
  assert.match(presentationSource, /\.management-page > \.audit-section > \.management-tabs/);
  assert.match(presentationSource, /\.management-page > \.operations-section > \.reservation-review-section/);
  assert.match(presentationSource, /\.management-page > \.resources-section > \.inventory-section/);
});
