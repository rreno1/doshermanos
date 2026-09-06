import { readFile } from 'node:fs/promises';
import process from 'node:process';

const rules = await readFile('firebase/storage.rules', 'utf8');
const violations = [];

for (const requiredPattern of [
  /currentUserProfile\(\)\.data\.status == 'active'/,
  /currentUserProfile\(\)\.data\.role in \['staff', 'admin'\]/,
  /request\.resource\.size <= 5 \* 1024 \* 1024/,
  /request\.resource\.contentType\.matches\('image\/\(jpeg\|png\|webp\)'\)/,
  /firestore\.exists\(\s*\/databases\/\(default\)\/documents\/inventory\/\$\(inventoryItemId\)/,
  /firestore\.exists\(itemPath\)/,
  /data\.get\('isDeleted', false\) != true/,
  /match \/\{allPaths=\*\*\} \{\s*allow read, write: if false;/,
]) {
  if (!requiredPattern.test(rules)) {
    violations.push(`Storage rules are missing required security invariant: ${requiredPattern}`);
  }
}

for (const forbiddenPattern of [
  /allow\s+(?:read|write|get|list|create|update|delete)(?:\s*,\s*\w+)*\s*:\s*if\s+true\s*;/,
  /contentType\.matches\('image\/\.\*'\)/,
  /request\.resource\.size\s*<\s*10\s*\*\s*1024\s*\*\s*1024/,
]) {
  if (forbiddenPattern.test(rules)) {
    violations.push(`Storage rules contain a forbidden broad-access pattern: ${forbiddenPattern}`);
  }
}

if (violations.length > 0) {
  console.error('Firebase Storage security guard failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Firebase Storage security guard passed.');
