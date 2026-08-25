import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const appPath = new URL('../src/app/App.tsx', import.meta.url);
const shellPath = new URL('../src/app/ManagementShell.tsx', import.meta.url);
const operationsPath = new URL('../src/features/operations/OperationsPanel.tsx', import.meta.url);
const resourcesPath = new URL('../src/features/resources/ResourcesPanel.tsx', import.meta.url);
const equipmentPanelPath = new URL('../src/features/resources/EquipmentPanel.tsx', import.meta.url);
const equipmentGridPath = new URL('../src/features/resources/EquipmentRegistryGrid.tsx', import.meta.url);
const interactionsCssPath = new URL('../src/app/management-interactions.css', import.meta.url);

test('management navigation uses operations and resources instead of standalone legacy modules', async () => {
  const [appSource, shellSource] = await Promise.all([
    readFile(appPath, 'utf8'),
    readFile(shellPath, 'utf8'),
  ]);

  assert.match(shellSource, /label: 'Operations'/);
  assert.match(shellSource, /label: 'Resources'/);
  assert.doesNotMatch(shellSource, /label: 'Packages'/);
  assert.doesNotMatch(shellSource, /label: 'Inventory'/);
  assert.doesNotMatch(shellSource, /label: 'Equipment'/);
  assert.match(appSource, /routeSegment === 'reservations' \|\| routeSegment === 'packages'/);
  assert.match(appSource, /routeSegment === 'inventory' \|\| routeSegment === 'equipment'/);
});

test('operations and resources keep the approved tab order', async () => {
  const [operationsSource, resourcesSource] = await Promise.all([
    readFile(operationsPath, 'utf8'),
    readFile(resourcesPath, 'utf8'),
  ]);

  const manual = operationsSource.indexOf("label: 'Manual reservation'");
  const pending = operationsSource.indexOf("label: 'Pending requests'");
  const packages = operationsSource.indexOf("label: 'Manage Packages'");
  assert.ok(manual >= 0 && pending > manual && packages > pending);
  assert.match(operationsSource, /useState<OperationsTab>\('manual'\)/);

  const inventoryItems = resourcesSource.indexOf("label: 'Inventory Items'");
  const inventoryActivity = resourcesSource.indexOf("label: 'Inventory Activity'");
  const registry = resourcesSource.indexOf("label: 'Equipment Registry'");
  const assignments = resourcesSource.indexOf("label: 'Assignments'");
  const equipmentActivity = resourcesSource.indexOf("label: 'Equipment Activity'");
  assert.ok(
    inventoryItems >= 0
      && inventoryActivity > inventoryItems
      && registry > inventoryActivity
      && assignments > registry
      && equipmentActivity > assignments,
  );
});

test('equipment registry uses cards and toolbar controls share one exact height', async () => {
  const [panelSource, gridSource, cssSource] = await Promise.all([
    readFile(equipmentPanelPath, 'utf8'),
    readFile(equipmentGridPath, 'utf8'),
    readFile(interactionsCssPath, 'utf8'),
  ]);

  assert.match(panelSource, /<EquipmentRegistryGrid/);
  assert.doesNotMatch(panelSource, /EquipmentItemList/);
  assert.match(gridSource, /<article className="equipment-card"/);
  assert.match(gridSource, /availableQuantity/);
  assert.match(cssSource, /\.management-data-controls \.management-search input,[\s\S]*height: var\(--management-control-height\)/);
  assert.match(cssSource, /\.management-data-controls > \.management-primary-button/);
  assert.match(cssSource, /\.management-data-controls \.management-filter-trigger/);
});
