import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [
  inventoryCss,
  equipmentCss,
  inventoryDialogCss,
  equipmentDialogCss,
  cardCss,
  equipmentCardCss,
  resourceImageCss,
  resourceScrollCss,
  modalCss,
] = await Promise.all([
  readFile(new URL('../src/modules/resources/inventory.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/resources/equipment.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/resources/inventory-dialog.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/resources/equipment-dialog.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/resources/inventory-cards.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/resources/equipment-cards.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/resources/resource-image.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/resources/resources-scroll.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/modal-behavior.css', import.meta.url), 'utf8'),
]);

test('resource panel CSS no longer carries the retired list and summary systems', () => {
  for (const [css, legacyClasses] of [
    [inventoryCss, ['inventory-summary', 'inventory-layout', 'inventory-item-row', 'inventory-movement-entry']],
    [equipmentCss, ['equipment-summary', 'equipment-layout', 'equipment-item-row', 'equipment-assignment-card']],
  ]) {
    assert.match(css, /--management-section-stack-gap/);
    for (const legacyClass of legacyClasses) {
      assert.doesNotMatch(css, new RegExp(`\\.${legacyClass}\\b`));
    }
  }
});

test('inventory and equipment dialogs defer outer surfaces to the shared modal contract', () => {
  assert.match(modalCss, /dialog\.inventory-dialog/);
  assert.match(modalCss, /dialog\.equipment-dialog/);

  for (const css of [inventoryDialogCss, equipmentDialogCss]) {
    assert.doesNotMatch(css, /::backdrop/);
    assert.doesNotMatch(css, /box-shadow:\s*0 30px 90px/);
    assert.doesNotMatch(css, /border-radius:\s*(?:14|20|22|26)px/);
    assert.match(css, /var\(--radius-md\)/);
    assert.match(css, /var\(--ui-toolbar-control-size\)/);
  }
});

test('resource cards use semantic Dos Hermanos colors and geometry', () => {
  assert.match(cardCss, /var\(--management-radius\)/);
  assert.match(cardCss, /var\(--surface2\)/);
  assert.match(cardCss, /var\(--text\)/);
  assert.match(cardCss, /var\(--shadow-sm\)/);
  assert.match(equipmentCardCss, /var\(--radius-md\)/);
  assert.match(equipmentCardCss, /var\(--amber\)/);

  assert.doesNotMatch(cardCss, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(cardCss, /rgba?\(/i);
  assert.doesNotMatch(equipmentCardCss, /#[0-9a-f]{3,8}\b/i);
});

test('resource image and scroll affordances use shared Dos Hermanos tokens', () => {
  assert.match(resourceImageCss, /var\(--radius-lg\)/);
  assert.match(resourceImageCss, /var\(--line-strong\)/);
  assert.match(resourceImageCss, /var\(--surface2\)/);
  assert.match(resourceScrollCss, /var\(--ui-toolbar-control-size\)/);
  assert.match(resourceScrollCss, /var\(--radius-md\)/);
  assert.match(resourceScrollCss, /var\(--ui-focus-outline\)/);

  for (const css of [resourceImageCss, resourceScrollCss]) {
    assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
    assert.doesNotMatch(css, /rgba?\(/i);
    assert.doesNotMatch(css, /border-radius:\s*(?:14|18|20|22|24|26|28)px/);
  }
});
