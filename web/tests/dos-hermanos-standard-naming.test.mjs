import assert from 'node:assert/strict';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

function textFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((name) => {
    const path = `${directory}/${name}`;
    const stats = lstatSync(path);
    if (stats.isSymbolicLink()) return [];
    if (stats.isDirectory()) return textFiles(path);
    return /\.(?:ts|tsx|js|jsx|mjs|css|md)$/.test(name) ? [path] : [];
  });
}

test('source and regression contracts are named for Dos Hermanos', () => {
  const retiredReferenceName = ['G', 'S', 'U'].join('');
  const retiredReferencePattern = new RegExp(`\\b${retiredReferenceName}\\b`);
  const offenders = [...textFiles('src'), ...textFiles('tests')]
    .filter((path) => retiredReferencePattern.test(readFileSync(path, 'utf8')))
    .sort();

  assert.deepEqual(
    offenders,
    [],
    `The canonical standard is Dos Hermanos; remove retired reference naming from these files:\n${offenders.join('\n')}`,
  );
});
