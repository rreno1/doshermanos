import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const panelPath = new URL('../src/features/inventory/InventoryPanel.tsx', import.meta.url);
const gridPath = new URL('../src/features/inventory/InventoryItemGrid.tsx', import.meta.url);
const imageServicePath = new URL('../src/features/inventory/inventory-image.service.ts', import.meta.url);
const cardsCssPath = new URL('../src/features/inventory/inventory-cards.css', import.meta.url);
const storageRulesPath = new URL('../../firebase/storage.rules', import.meta.url);

test('inventory items use the management card surface while activity stays tabular', async () => {
  const [panelSource, gridSource, cardsCss] = await Promise.all([
    readFile(panelPath, 'utf8'),
    readFile(gridPath, 'utf8'),
    readFile(cardsCssPath, 'utf8'),
  ]);

  assert.match(panelSource, /<InventoryItemGrid/);
  assert.match(panelSource, /Loading pantry inventory/);
  assert.match(panelSource, /label: 'in stock'/);
  assert.match(panelSource, /label: 'low stock'/);
  assert.match(panelSource, /label: 'out of stock'/);
  assert.match(gridSource, /<article className="inventory-card">/);
  assert.match(gridSource, /Update stock/);
  assert.match(cardsCss, /grid-template-columns: repeat\(3/);
  assert.match(cardsCss, /@media \(max-width: 620px\)[\s\S]*repeat\(2/);
  assert.match(panelSource, /<table className="management-table">/);
});

test('inventory image uploads are constrained and protected', async () => {
  const [imageService, storageRules] = await Promise.all([
    readFile(imageServicePath, 'utf8'),
    readFile(storageRulesPath, 'utf8'),
  ]);

  assert.match(imageService, /5 \* 1024 \* 1024/);
  assert.match(imageService, /image\/jpeg/);
  assert.match(imageService, /image\/png/);
  assert.match(imageService, /image\/webp/);
  assert.match(imageService, /inventory\/\$\{inventoryItemId\}\/item-image/);
  assert.match(storageRules, /match \/inventory\/\{inventoryItemId\}\/item-image/);
  assert.match(storageRules, /role in \['staff', 'admin'\]/);
  assert.match(storageRules, /request\.resource\.size <= 5 \* 1024 \* 1024/);
  assert.match(storageRules, /image\/\(jpeg\|png\|webp\)/);
});
