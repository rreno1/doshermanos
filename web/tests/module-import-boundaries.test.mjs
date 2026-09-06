import assert from 'node:assert/strict';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const filePath = path.join(directory, name);
    const stats = lstatSync(filePath);
    if (stats.isDirectory()) return sourceFiles(filePath);
    return /\.(?:ts|tsx|js|jsx)$/.test(name) ? [filePath] : [];
  });
}

function moduleName(filePath) {
  return path.relative('src/modules', filePath).split(path.sep)[0];
}

test('cross-module dependencies use @modules aliases instead of sibling filesystem traversal', () => {
  const offenders = [];
  const importPattern = /(?:from\s+|import\s+)['"](\.\.\/[^'"]+)['"]/g;

  for (const filePath of sourceFiles('src/modules')) {
    const sourceModule = moduleName(filePath);
    const source = readFileSync(filePath, 'utf8');

    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      const resolvedTarget = path.normalize(path.resolve(path.dirname(filePath), specifier));
      const modulesRoot = path.normalize(path.resolve('src/modules')) + path.sep;
      if (!resolvedTarget.startsWith(modulesRoot)) continue;

      const targetModule = path.relative(path.resolve('src/modules'), resolvedTarget).split(path.sep)[0];
      if (targetModule !== sourceModule) {
        offenders.push(`${filePath}: ${specifier} -> ${targetModule}`);
      }
    }
  }

  assert.deepEqual(
    offenders.sort(),
    [],
    `Cross-module imports must use @modules/<domain>/... aliases:\n${offenders.sort().join('\n')}`,
  );
});
