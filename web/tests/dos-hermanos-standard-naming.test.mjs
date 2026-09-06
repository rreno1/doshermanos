import assert from 'node:assert/strict';
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import test from 'node:test';

const sourceRoots = ['src', 'tests'];
const forbiddenBenchmarkPattern = /\b(?:gsu[-_ ]?waste|gsu[-_ ]?parity|gsu[-_ ]?starter[-_ ]?kit)\b/i;
const forbiddenBackendPattern = /\bsupabase\b|@supabase\//i;

function files(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = `${directory}/${name}`;
    const stats = lstatSync(path);
    if (stats.isSymbolicLink()) return [];
    if (stats.isDirectory()) return files(path);
    return /\.(?:ts|tsx|js|jsx|mjs|css|json)$/.test(name) ? [path] : [];
  });
}

test('production source and regression tests name the standard as Dos Hermanos', () => {
  const offenders = sourceRoots
    .flatMap(files)
    .filter((path) => forbiddenBenchmarkPattern.test(readFileSync(path, 'utf8')))
    .sort();

  assert.deepEqual(
    offenders,
    [],
    `Production source/tests must use Dos Hermanos naming rather than benchmark branding:\n${offenders.join('\n')}`,
  );
});

test('web production source and manifest keep Firebase as the only backend SDK boundary', () => {
  const productionFiles = files('src');
  const offenders = productionFiles
    .filter((path) => forbiddenBackendPattern.test(readFileSync(path, 'utf8')))
    .sort();
  const packageManifest = readFileSync('package.json', 'utf8');

  assert.deepEqual(
    offenders,
    [],
    `Unexpected non-Firebase backend reference found in web production source:\n${offenders.join('\n')}`,
  );
  assert.doesNotMatch(packageManifest, forbiddenBackendPattern);
  assert.match(packageManifest, /"firebase"\s*:/);
});
