import assert from 'node:assert/strict';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

function cssFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = `${directory}/${name}`;
    const stats = lstatSync(path);
    if (stats.isDirectory()) return cssFiles(path);
    return name.endsWith('.css') ? [path] : [];
  });
}

const moduleCssFiles = cssFiles('src/modules');

function nonWhiteHexColors(source) {
  return [...source.matchAll(/#[0-9a-f]{3,8}\b/gi)]
    .map((match) => match[0].toLowerCase())
    .filter((value) => value !== '#fff' && value !== '#ffffff');
}

function hasIndependentBoxShadow(source) {
  for (const match of source.matchAll(/box-shadow:\s*([^;]+);/gi)) {
    const value = match[1].trim();
    if (/^none(?:\s*!important)?$/i.test(value) || value.startsWith('var(')) continue;
    return true;
  }

  return false;
}

test('module CSS does not revive oversized custom corner radii', () => {
  const offenders = [];

  for (const path of moduleCssFiles) {
    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(/border-radius:\s*(\d+)px/g)) {
      const radius = Number(match[1]);
      if (radius > 10) offenders.push(`${path}: ${match[0]}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Feature CSS must use GSU radius tokens instead of custom radii above 10px:\n${offenders.join('\n')}`,
  );
});

test('module CSS uses semantic palette tokens instead of local hard-coded colors', () => {
  const offenders = [];

  for (const path of moduleCssFiles) {
    const source = readFileSync(path, 'utf8');
    const colors = nonWhiteHexColors(source);
    if (colors.length > 0 || /rgba?\(/i.test(source)) {
      offenders.push(`${path}: ${[...new Set(colors)].join(', ') || 'rgb/rgba literal'}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Feature CSS must use shared GSU semantic color tokens:\n${offenders.join('\n')}`,
  );
});

test('module CSS does not create independent numeric shadow systems', () => {
  const offenders = moduleCssFiles.filter((path) => {
    const source = readFileSync(path, 'utf8');
    return hasIndependentBoxShadow(source);
  });

  assert.deepEqual(
    offenders,
    [],
    `Feature CSS must use shared GSU shadow tokens:\n${offenders.join('\n')}`,
  );
});
