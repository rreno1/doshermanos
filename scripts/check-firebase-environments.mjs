import { readFile } from 'node:fs/promises';
import process from 'node:process';

const deploymentProjectId = 'dos-hermanos-hilongos';
const violations = [];

const firebaseAliases = JSON.parse(await readFile('.firebaserc', 'utf8'));
const projects = firebaseAliases.projects ?? {};

if (projects.default) {
  violations.push('.firebaserc must not define a default Firebase project.');
}

if (projects.staging !== deploymentProjectId) {
  violations.push(`The staging Firebase alias must point to ${deploymentProjectId}.`);
}

if (projects.production !== deploymentProjectId) {
  violations.push(`The production Firebase alias must point to ${deploymentProjectId}.`);
}

await ensureTemplateIsNotDeployment('web/.env.example');
await ensureDeploymentTemplateMatches('web/.env.staging.example');
await ensureDeploymentTemplateMatches('web/.env.production.example');
await ensureTemplateIsNotDeployment('mobile/.env.example');
await ensureDeploymentTemplateMatches('mobile/.env.staging.example');
await ensureDeploymentTemplateMatches('mobile/.env.production.example');
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

async function ensureTemplateIsNotDeployment(path) {
  const content = await readFile(path, 'utf8');

  if (content.includes(deploymentProjectId)) {
    violations.push(`${path} contains the shared staging/production Firebase project ID.`);
  }
}

async function ensureDeploymentTemplateMatches(path) {
  const content = await readFile(path, 'utf8');

  if (!content.includes(deploymentProjectId)) {
    violations.push(`${path} does not contain the approved deployment Firebase project ID.`);
  }
}

async function ensureTemplateContains(path, expectedText) {
  const content = await readFile(path, 'utf8');

  if (!content.includes(expectedText)) {
    violations.push(`${path} must contain ${expectedText}.`);
  }
}
