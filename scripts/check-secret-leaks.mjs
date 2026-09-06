import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const repositoryRoot = process.cwd();
const excludedDirectories = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  '.expo',
]);
const blockedKeyExtensions = new Set(['.key', '.pem', '.p12', '.pfx']);
const allowedEnvironmentPattern = /^\.env(?:\.[a-z0-9_-]+)?\.example$/i;
const blockedEnvironmentPattern = /^\.env(?:\.[a-z0-9_-]+)?$/i;

const secretPatterns = [
  {
    label: 'private key material',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    label: 'Google service-account credential',
    pattern: /"type"\s*:\s*"service_account"/,
  },
  {
    label: 'Google service-account private key',
    pattern: /"private_key"\s*:\s*"-----BEGIN/,
  },
  {
    label: 'GitHub access token',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  },
  {
    label: 'AWS access key',
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
  },
  {
    label: 'OpenAI secret key',
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  },
  {
    label: 'Slack access token',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  },
  {
    label: 'Stripe secret key',
    pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
  },
];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git') return [];

    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return excludedDirectories.has(entry.name) ? [] : walk(absolutePath);
    }

    return entry.isFile() ? [absolutePath] : [];
  });
}

function isProbablyBinary(buffer) {
  return buffer.subarray(0, Math.min(buffer.length, 8_192)).includes(0);
}

const findings = [];

for (const absolutePath of walk(repositoryRoot)) {
  const path = relative(repositoryRoot, absolutePath).replaceAll('\\', '/');
  const fileName = path.split('/').at(-1) ?? path;
  const extension = extname(fileName).toLowerCase();

  if (blockedKeyExtensions.has(extension)) {
    findings.push(`${path}: private-key container files are not allowed in the repository`);
    continue;
  }

  if (blockedEnvironmentPattern.test(fileName) && !allowedEnvironmentPattern.test(fileName)) {
    findings.push(`${path}: real environment files must not be committed; keep only *.example templates`);
    continue;
  }

  const stats = statSync(absolutePath);
  if (stats.size > 5_000_000) continue;

  const buffer = readFileSync(absolutePath);
  if (isProbablyBinary(buffer)) continue;

  const source = buffer.toString('utf8');
  for (const { label, pattern } of secretPatterns) {
    if (pattern.test(source)) {
      findings.push(`${path}: possible ${label}`);
    }
  }
}

if (findings.length > 0) {
  console.error('Potential credential material detected. Secret values are intentionally not printed.');
  for (const finding of findings.sort()) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log('Secret leak guard passed.');
}
