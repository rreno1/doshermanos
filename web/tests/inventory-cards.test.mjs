import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const inventoryPanelPath = new URL('../src/modules/resources/InventoryPanel.tsx', import.meta.url);
const inventoryGridPath = new URL('../src/modules/resources/InventoryItemGrid.tsx', import.meta.url);
const equipmentPanelPath = new URL('../src/modules/resources/EquipmentPanel.tsx', import.meta.url);
const equipmentGridPath = new URL('../src/modules/resources/EquipmentRegistryGrid.tsx', import.meta.url);
const equipmentDialogPath = new URL('../src/modules/resources/EquipmentItemDialog.tsx', import.meta.url);
const imageServicePath = new URL('../src/modules/resources/resource-image.service.ts', import.meta.url);
const progressivePath = new URL('../src/modules/resources/useProgressiveItems.ts', import.meta.url);
const cardsCssPath = new URL('../src/modules/resources/inventory-cards.css', import.meta.url);
const storageRulesPath = new URL('../../firebase/storage.rules', import.meta.url);

test('inventory and equipment registries use matching cards with scroll driven reveal', async () => {
  const [inventoryPanel, inventoryGrid, equipmentPanel, equipmentGrid, progressiveSource, cardsCss] = await Promise.all([
    readFile(inventoryPanelPath, 'utf8'),
    readFile(inventoryGridPath, 'utf8'),
    readFile(equipmentPanelPath, 'utf8'),
    readFile(equipmentGridPath, 'utf8'),
    readFile(progressivePath, 'utf8'),
    readFile(cardsCssPath, 'utf8'),
  ]);

  assert.match(inventoryPanel, /useProgressiveItems/);
  assert.match(equipmentPanel, /useProgressiveItems/);
  assert.doesNotMatch(inventoryPanel, /itemPage\.pageItems/);
  assert.doesNotMatch(equipmentPanel, /itemPage\.pageItems/);
  assert.match(inventoryGrid, /<article className="inventory-card">/);
  assert.match(equipmentGrid, /inventory-card equipment-card/);
  assert.match(equipmentGrid, /useResourceImageUrl\('equipment'/);
  assert.match(progressiveSource, /IntersectionObserver/);
  assert.match(progressiveSource, /defaultBatchSize = 12/);
  assert.match(cardsCss, /grid-template-columns: repeat\(3/);
  assert.match(cardsCss, /@media \(max-width: 620px\)[\s\S]*repeat\(2/);
  assert.match(inventoryPanel, /<table className="management-table">/);
});

test('inventory and equipment image uploads share constrained Firebase Storage handling', async () => {
  const [imageService, equipmentDialog, storageRules] = await Promise.all([
    readFile(imageServicePath, 'utf8'),
    readFile(equipmentDialogPath, 'utf8'),
    readFile(storageRulesPath, 'utf8'),
  ]);

  assert.match(imageService, /5 \* 1024 \* 1024/);
  assert.match(imageService, /image\/jpeg/);
  assert.match(imageService, /image\/png/);
  assert.match(imageService, /image\/webp/);
  assert.match(imageService, /\$\{kind\}\/\$\{resourceId\}\/item-image/);
  assert.match(equipmentDialog, /label="Equipment image"/);
  assert.match(storageRules, /match \/inventory\/\{inventoryItemId\}\/item-image/);
  assert.match(storageRules, /match \/equipment\/\{equipmentItemId\}\/item-image/);
  assert.match(storageRules, /role in \['staff', 'admin'\]/);
  assert.match(storageRules, /request\.resource\.size <= 5 \* 1024 \* 1024/);
  assert.match(storageRules, /image\/\(jpeg\|png\|webp\)/);
});

test('resource image placeholders do not wait on a missing-image spinner', async () => {
  const [inventoryGrid, equipmentGrid] = await Promise.all([
    readFile(inventoryGridPath, 'utf8'),
    readFile(equipmentGridPath, 'utf8'),
  ]);

  assert.doesNotMatch(inventoryGrid, /isLoadingImage/);
  assert.doesNotMatch(inventoryGrid, /inventory-image-spinner/);
  assert.doesNotMatch(equipmentGrid, /isLoadingImage/);
  assert.match(inventoryGrid, /InventoryPlaceholderIcon/);
  assert.match(equipmentGrid, /EquipmentPlaceholderIcon/);
});
