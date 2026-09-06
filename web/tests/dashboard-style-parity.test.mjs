import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [dashboardCss, dashboardSource] = await Promise.all([
  readFile(new URL('../src/modules/dashboard/dashboard.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/dashboard/DashboardPanel.tsx', import.meta.url), 'utf8'),
]);

test('dashboard keeps its domain widgets while using Dos Hermanos geometry and surfaces', () => {
  assert.match(dashboardSource, /className="dashboard-grid"/);
  assert.match(dashboardSource, /className={`dashboard-metric/);
  assert.match(dashboardSource, /className="dashboard-module-link"/);

  assert.match(dashboardCss, /border-radius:\s*var\(--radius-lg\)/);
  assert.match(dashboardCss, /border-radius:\s*var\(--radius-md\)/);
  assert.match(dashboardCss, /background:\s*var\(--surface-raised\)/);
  assert.match(dashboardCss, /box-shadow:\s*var\(--shadow-sm\)/);
  assert.match(dashboardCss, /outline:\s*var\(--ui-focus-outline\)/);
  assert.match(dashboardCss, /var\(--amber\)/);
});

test('dashboard does not reintroduce a separate hard-coded visual palette', () => {
  assert.doesNotMatch(dashboardCss, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(dashboardCss, /rgba?\(/i);
  assert.doesNotMatch(dashboardCss, /border-radius:\s*(?:14|18|20|22|24|26|28)px/);
});

test('dashboard retains the approved responsive information density', () => {
  assert.match(dashboardCss, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(dashboardCss, /@media \(max-width: 980px\)[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(dashboardCss, /@media \(max-width: 760px\)[\s\S]*\.dashboard-module-grid[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(dashboardCss, /@media \(prefers-reduced-motion: reduce\)/);
});
