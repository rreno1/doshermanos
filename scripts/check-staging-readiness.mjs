import { readFile } from 'node:fs/promises';
import process from 'node:process';

const deploymentProjectId = 'dos-hermanos-hilongos';
const firebaseAliases = JSON.parse(await readFile('.firebaserc', 'utf8'));
const projects = firebaseAliases.projects ?? {};
const errors = [];

if (!projects.staging) {
  errors.push('Add the staging Firebase project alias to .firebaserc before staging deployment.');
} else if (projects.staging !== deploymentProjectId) {
  errors.push(`The staging Firebase alias must point to ${deploymentProjectId}.`);
}

if (projects.default) {
  errors.push('Remove the default Firebase project alias; deployments must name their target explicitly.');
}

const stagingEnvironment = await readEnvironmentFile('web/.env.staging');
const requiredWebKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

if (stagingEnvironment) {
  for (const key of requiredWebKeys) {
    if (!stagingEnvironment.get(key)?.trim()) {
      errors.push(`web/.env.staging is missing a value for ${key}.`);
    }
  }

  const stagingProjectId = stagingEnvironment.get('VITE_FIREBASE_PROJECT_ID');

  if (stagingProjectId && stagingProjectId !== deploymentProjectId) {
    errors.push(`web/.env.staging must point to ${deploymentProjectId}.`);
  }

  if (projects.staging && stagingProjectId && stagingProjectId !== projects.staging) {
    errors.push('web/.env.staging project ID must match the Firebase staging alias.');
  }
}

if (errors.length > 0) {
  console.error('Staging readiness check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Staging Firebase target is ready: ${projects.staging}`);

async function readEnvironmentFile(path) {
  try {
    const content = await readFile(path, 'utf8');
    const values = new Map();

    for (const line of content.split(/\r?\n/)) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf('=');
      if (separatorIndex < 1) {
        continue;
      }

      values.set(
        trimmedLine.slice(0, separatorIndex).trim(),
        trimmedLine.slice(separatorIndex + 1).trim(),
      );
    }

    return values;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      errors.push('Create web/.env.staging from web/.env.staging.example before staging deployment.');
      return null;
    }

    throw error;
  }
}
