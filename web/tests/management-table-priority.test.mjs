import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tableScreens = [
  '../src/modules/resources/InventoryPanel.tsx',
  '../src/modules/payments/PaymentsPanel.tsx',
  '../src/modules/users/UsersRolesPanel.tsx',
  '../src/modules/audit/AuditPanel.tsx',
  '../src/modules/reports/ReportsPanel.tsx',
  '../src/modules/resources/EquipmentAssignmentList.tsx',
  '../src/modules/resources/EquipmentActivityList.tsx',
  '../src/modules/operations/PackageManagementPanel.tsx',
];

test('every management data table declares semantic column priorities', async () => {
  for (const relativePath of tableScreens) {
    const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
    assert.match(source, /scope="col"/, `${relativePath} must retain semantic column headers.`);
    assert.match(source, /col-primary/, `${relativePath} must identify its primary record column.`);
    assert.match(source, /col-status/, `${relativePath} must identify status or state priority.`);
  }
});

test('actionable management tables preserve an explicit action column', async () => {
  for (const relativePath of [
    '../src/modules/payments/PaymentsPanel.tsx',
    '../src/modules/users/UsersRolesPanel.tsx',
    '../src/modules/resources/EquipmentAssignmentList.tsx',
    '../src/modules/operations/PackageManagementPanel.tsx',
  ]) {
    const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
    assert.match(source, /col-actions/, `${relativePath} must retain the action priority column.`);
  }
});
