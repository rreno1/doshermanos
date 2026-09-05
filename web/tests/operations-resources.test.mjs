import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const navigationPath = new URL('../src/core/app/nav.ts', import.meta.url);
const operationsPath = new URL('../src/modules/operations/OperationsPanel.tsx', import.meta.url);
const operationsLayoutPath = new URL('../src/modules/operations/operations-layout.css', import.meta.url);
const resourcesPath = new URL('../src/modules/resources/ResourcesPanel.tsx', import.meta.url);
const equipmentPanelPath = new URL('../src/modules/resources/EquipmentPanel.tsx', import.meta.url);
const equipmentGridPath = new URL('../src/modules/resources/EquipmentRegistryGrid.tsx', import.meta.url);
const presentationCssPath = new URL('../src/styles/presentation-contract.css', import.meta.url);
const tokensCssPath = new URL('../src/styles/tokens.css', import.meta.url);

test('management navigation uses operations and resources instead of standalone legacy modules', async () => {
  const navigationSource = await readFile(navigationPath, 'utf8');

  assert.match(navigationSource, /label: 'Operations'/);
  assert.match(navigationSource, /label: 'Resources'/);
  assert.doesNotMatch(navigationSource, /label: 'Packages'/);
  assert.doesNotMatch(navigationSource, /label: 'Inventory'/);
  assert.doesNotMatch(navigationSource, /label: 'Equipment'/);
  assert.match(navigationSource, /routeSegment === 'reservations' \|\| routeSegment === 'packages'/);
  assert.match(navigationSource, /routeSegment === 'inventory' \|\| routeSegment === 'equipment'/);
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

test('pending requests use the management workspace width without legacy section spacing', async () => {
  const [operationsSource, layoutSource] = await Promise.all([
    readFile(operationsPath, 'utf8'),
    readFile(operationsLayoutPath, 'utf8'),
  ]);

  assert.match(operationsSource, /operations-layout\.css/);
  assert.match(layoutSource, /\.operations-section > \.reservation-review-section/);
  assert.match(layoutSource, /width:\s*100%/);
  assert.match(layoutSource, /margin:\s*0/);
  assert.match(layoutSource, /padding:\s*24px 0 0/);
  assert.doesNotMatch(layoutSource, /padding:\s*72px/);
});

test('equipment registry shares inventory cards and GSU control geometry', async () => {
  const [panelSource, gridSource, presentationSource, tokensSource] = await Promise.all([
    readFile(equipmentPanelPath, 'utf8'),
    readFile(equipmentGridPath, 'utf8'),
    readFile(presentationCssPath, 'utf8'),
    readFile(tokensCssPath, 'utf8'),
  ]);

  assert.match(panelSource, /<EquipmentRegistryGrid/);
  assert.doesNotMatch(panelSource, /EquipmentItemList/);
  assert.match(gridSource, /<article className="inventory-card equipment-card"/);
  assert.match(gridSource, /useResourceImageUrl\('equipment'/);
  assert.match(gridSource, /availableQuantity/);

  assert.match(tokensSource, /--ui-compact-control-size:\s*36px/);
  assert.match(tokensSource, /--ui-toolbar-control-size:\s*40px/);
  assert.match(tokensSource, /--ui-form-control-height:\s*42px/);
  assert.match(
    presentationSource,
    /\.management-data-controls \.management-search input,[\s\S]*height: var\(--ui-toolbar-control-size\) !important/,
  );
  assert.match(presentationSource, /\.management-data-controls > \.management-primary-button/);
  assert.match(presentationSource, /\.management-data-controls \.management-filter-trigger/);
  assert.match(presentationSource, /min-height: var\(--ui-form-control-height\) !important/);
});
