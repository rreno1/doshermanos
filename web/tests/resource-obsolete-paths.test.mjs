import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, lstatSync } from 'node:fs';
import test from 'node:test';

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = `${directory}/${name}`;
    const stats = lstatSync(path);
    if (stats.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|js|jsx|mjs|css)$/.test(name) ? [path] : [];
  });
}

test('resource module does not revive retired inventory image wrappers or equipment activity stylesheet', () => {
  for (const path of [
    'src/modules/resources/inventory-image.css',
    'src/modules/resources/inventory-image.service.ts',
    'src/modules/resources/equipment-activity.css',
  ]) {
    assert.equal(existsSync(path), false, `Retired resource compatibility path must stay removed: ${path}`);
  }
});

test('resource source does not import retired compatibility paths', () => {
  const offenders = sourceFiles('src/modules/resources')
    .filter((path) => /inventory-image(?:\.service)?|equipment-activity\.css/.test(readFileSync(path, 'utf8')))
    .sort();
  assert.deepEqual(offenders, [], `Retired resource imports found:\n${offenders.join('\n')}`);
});
