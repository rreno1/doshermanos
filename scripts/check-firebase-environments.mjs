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

await ensureDevelopmentTemplateIsNotProduction('web/.env.example');
await ensureDevelopmentTemplateIsNotProduction('mobile/.env.example');
await ensureProductionTemplateMatches('web/.env.production.example');
await ensureProductionTemplateMatches('mobile/.env.production.example');

if (violations.length > 0) {
  console.error('Firebase environment guard failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Firebase environment guard passed.');

async function ensureDevelopmentTemplateIsNotProduction(path) {
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
