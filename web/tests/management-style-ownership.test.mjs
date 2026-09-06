import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [paymentsCss, usersCss, auditCss, reportsCss, paymentsSource, usersSource, auditSource, reportsSource] = await Promise.all([
  readFile(new URL('../src/modules/payments/payments.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/users/users.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/audit/audit.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/reports/reports.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/payments/PaymentsPanel.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/users/UsersRolesPanel.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/audit/AuditPanel.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/reports/ReportsPanel.tsx', import.meta.url), 'utf8'),
]);

function assertSharedManagementComposition(source) {
  assert.match(source, /<ManagementToolbar/);
  assert.match(source, /<ManagementTableFrame/);
  assert.match(source, /className="management-table"/);
}

test('payments management view no longer depends on the old card and list subsystem', () => {
  assertSharedManagementComposition(paymentsSource);
  for (const legacyClass of [
    'payments-layout',
    'payments-main-column',
    'payments-activity',
    'payment-reservation-row',
    'payment-history-list',
    'payment-history-entry',
  ]) {
    assert.doesNotMatch(paymentsCss, new RegExp(`\\.${legacyClass}\\b`));
  }

  assert.match(paymentsCss, /var\(--ui-toolbar-control-size\)/);
  assert.match(paymentsCss, /var\(--radius-md\)/);
  assert.doesNotMatch(paymentsCss, /border-radius:\s*(?:18|20|22|24|26|28)px/);
});

test('users audit and reports use shared management tables without parallel CSS table systems', () => {
  assertSharedManagementComposition(usersSource);
  assertSharedManagementComposition(auditSource);
  assertSharedManagementComposition(reportsSource);

  assert.doesNotMatch(usersCss, /\.users-table\b/);
  assert.doesNotMatch(usersCss, /\.users-summary\b/);
  assert.doesNotMatch(auditCss, /\.audit-entry\b/);
  assert.doesNotMatch(auditCss, /\.audit-list\b/);
  assert.doesNotMatch(reportsCss, /\.report-table\b/);
  assert.doesNotMatch(reportsCss, /\.reports-controls\b/);
});

test('thin management feature CSS keeps spacing ownership in shared tokens', () => {
  for (const css of [usersCss, auditCss, reportsCss]) {
    assert.match(css, /--management-section-stack-gap/);
    assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
    assert.doesNotMatch(css, /rgba?\(/i);
  }
});
