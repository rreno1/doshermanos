import { readFile } from 'node:fs/promises';
import process from 'node:process';

const productionProjectId = 'dos-hermanos-hilongos';
const violations = [];

const firebaseAliases = JSON.parse(await readFile('.firebaserc', 'utf8'));
const projects = firebaseAliases.projects ?? {};

if (projects.default) {
  violations.push('.firebaserc must not define a default Firebase project.');
}

if (projects.production !== productionProjectId) {
  violations.push('The production Firebase alias must point to dos-hermanos-hilongos.');
}

await ensureTemplateIsNotProduction('web/.env.example');
await ensureTemplateIsNotProduction('web/.env.staging.example');
await ensureTemplateIsNotProduction('mobile/.env.example');
await ensureTemplateIsNotProduction('mobile/.env.staging.example');
await ensureProductionTemplateMatches('web/.env.production.example');
await ensureProductionTemplateMatches('mobile/.env.production.example');
await ensureTemplateContains('mobile/.env.example', 'EXPO_PUBLIC_APP_ENV=development');
await ensureTemplateContains('mobile/.env.staging.example', 'EXPO_PUBLIC_APP_ENV=staging');
await ensureTemplateContains('mobile/.env.production.example', 'EXPO_PUBLIC_APP_ENV=production');

if (violations.length > 0) {
  console.error('Firebase environment guard failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Firebase environment guard passed.');

async function ensureTemplateIsNotProduction(path) {
  const content = await readFile(path, 'utf8');

  if (content.includes(productionProjectId)) {
    violations.push(`${path} contains the production Firebase project ID.`);
  }
}

async function ensureProductionTemplateMatches(path) {
  const content = await readFile(path, 'utf8');

  if (!content.includes(productionProjectId)) {
    violations.push(`${path} does not contain the approved production Firebase project ID.`);
  }
}

async function ensureTemplateContains(path, expectedText) {
  const content = await readFile(path, 'utf8');

  if (!content.includes(expectedText)) {
    violations.push(`${path} must contain ${expectedText}.`);
  }
}
