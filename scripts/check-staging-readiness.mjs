import { readFile } from 'node:fs/promises';
import process from 'node:process';

const productionProjectId = 'dos-hermanos-hilongos';
const firebaseAliases = JSON.parse(await readFile('.firebaserc', 'utf8'));
const projects = firebaseAliases.projects ?? {};
const errors = [];

if (!projects.staging) {
  errors.push('Add a staging Firebase project alias to .firebaserc before staging deployment.');
} else if (projects.staging === productionProjectId) {
  errors.push('The staging Firebase alias must not point to the production project.');
}

if (projects.default) {
  errors.push('Remove the default Firebase project alias; deployments must name their target explicitly.');
}

if (errors.length > 0) {
  console.error('Staging readiness check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Staging Firebase alias is configured: ${projects.staging}`);
