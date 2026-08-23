import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import process from 'node:process';

const sourceRoots = ['web/src', 'mobile/src'];
const sourceExtensions = new Set(['.ts', '.tsx']);
const maximumLinesPerSourceFile = 420;
const bannedDirectoryNames = new Set([
  'adapters',
  'controllers',
  'factories',
  'managers',
  'repositories',
  'services',
  'use-cases',
]);

const violations = [];

for (const root of sourceRoots) {
  await scanDirectory(root);
}

if (violations.length > 0) {
  console.error('Readability guardrail failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Readability guardrail passed.');

async function scanDirectory(directory) {
  const directoryInfo = await stat(directory);
  if (!directoryInfo.isDirectory()) {
    return;
  }

  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (bannedDirectoryNames.has(entry.name)) {
        violations.push(
          `${normalisePath(fullPath)} creates a generic architecture layer. Keep code with the feature that owns it.`,
        );
      }

      await scanDirectory(fullPath);
      continue;
    }

    if (!entry.isFile() || !isTypeScriptSource(entry.name)) {
      continue;
    }

    await checkSourceFile(fullPath);
  }
}

async function checkSourceFile(filePath) {
  const source = await readFile(filePath, 'utf8');
  const lines = source.split(/\r?\n/);
  const relativePath = normalisePath(relative(process.cwd(), filePath));

  if (lines.length > maximumLinesPerSourceFile) {
    violations.push(
      `${relativePath} has ${lines.length} lines. Split real responsibilities before adding more code.`,
    );
  }

  if (/\bdebugger\s*;/.test(source)) {
    violations.push(`${relativePath} contains a debugger statement.`);
  }

  if (/\bconsole\.(log|debug|info|warn|error)\s*\(/.test(source)) {
    violations.push(`${relativePath} contains a production console statement.`);
  }

  if (/:\s*any\b|\bas\s+any\b|<any>/.test(source)) {
    violations.push(`${relativePath} uses explicit any. Define the real type instead.`);
  }
}

function isTypeScriptSource(fileName) {
  for (const extension of sourceExtensions) {
    if (fileName.endsWith(extension)) {
      return true;
    }
  }

  return false;
}

function normalisePath(filePath) {
  return filePath.split(sep).join('/');
}
