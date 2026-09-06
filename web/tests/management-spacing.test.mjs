import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const styleIndexPath = new URL('../src/styles/index.css', import.meta.url);
const presentationPath = new URL('../src/styles/presentation-contract.css', import.meta.url);
const widgetsPath = new URL('../src/styles/widgets.css', import.meta.url);
const usersPath = new URL('../src/modules/users/UsersRolesPanel.tsx', import.meta.url);
const auditPath = new URL('../src/modules/audit/AuditPanel.tsx', import.meta.url);

test('management tabs use the canonical GSU twelve-pixel content rhythm', async () => {
  const [styleIndexSource, presentationSource, widgetsSource, usersSource, auditSource] = await Promise.all([
    readFile(styleIndexPath, 'utf8'),
    readFile(presentationPath, 'utf8'),
    readFile(widgetsPath, 'utf8'),
    readFile(usersPath, 'utf8'),
    readFile(auditPath, 'utf8'),
  ]);

  assert.match(styleIndexSource, /@import '\.\/presentation-contract\.css';/);
  assert.doesNotMatch(styleIndexSource, /management-spacing\.css/);
  assert.match(presentationSource, /--management-tab-content-gap:\s*12px/);
  assert.match(presentationSource, /--management-section-stack-gap:\s*12px/);
  assert.match(widgetsSource, /\.tab-bar[\s\S]*margin-bottom:\s*12px/);
  assert.match(presentationSource, /\.management-page > \.operations-section > \.tab-bar/);
  assert.match(presentationSource, /\.management-page > \.resources-section > \.tab-bar/);
  assert.match(presentationSource, /\.management-page > \.payments-section > \.tab-bar/);
  assert.match(presentationSource, /\.management-page > \.reports-section > \.tab-bar/);
  assert.match(presentationSource, /\.management-page > \.operations-section > \.reservation-review-section/);
  assert.match(presentationSource, /\.management-page > \.resources-section > \.inventory-section/);
  assert.doesNotMatch(presentationSource, /\.management-tabs/);

  assert.doesNotMatch(usersSource, /ManagementTabs/);
  assert.doesNotMatch(auditSource, /ManagementTabs/);
});
