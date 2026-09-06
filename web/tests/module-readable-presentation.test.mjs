import assert from 'node:assert/strict';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function componentFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const filePath = path.join(directory, name);
    const stats = lstatSync(filePath);
    if (stats.isDirectory()) return componentFiles(filePath);
    return /\.tsx$/.test(name) ? [filePath] : [];
  });
}

test('module components keep reusable static presentation in CSS classes', () => {
  const offenders = componentFiles('src/modules')
    .filter((filePath) => /style\s*=\s*\{\s*\{/.test(readFileSync(filePath, 'utf8')))
    .sort();

  assert.deepEqual(
    offenders,
    [],
    `Static JSX style objects belong in named CSS/shared contracts:\n${offenders.join('\n')}`,
  );
});
