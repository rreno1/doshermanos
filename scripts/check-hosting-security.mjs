import { readFile } from 'node:fs/promises';
import process from 'node:process';

const config = JSON.parse(await readFile('firebase.json', 'utf8'));
const headers = config.hosting?.headers ?? [];
const violations = [];

const globalHeaders = getHeaderMap('**');
const indexHeaders = getHeaderMap('/index.html');
const assetHeaders = getHeaderMap('/assets/**');
const contentSecurityPolicy = globalHeaders.get('content-security-policy') ?? '';

for (const directive of [
  "default-src 'self'",
  "script-src 'self'",
  "https://apis.google.com",
  "https://www.gstatic.com",
  "https://www.google.com/recaptcha/",
  "https://www.gstatic.com/recaptcha/",
  "frame-src 'self'",
  "https://accounts.google.com",
  "https://*.firebaseapp.com",
  "https://recaptcha.google.com/recaptcha/",
  "connect-src 'self'",
  "https://*.googleapis.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  'upgrade-insecure-requests',
]) {
  if (!contentSecurityPolicy.includes(directive)) {
    violations.push(`Content-Security-Policy must contain: ${directive}`);
  }
}

requireHeader('x-content-type-options', 'nosniff');
requireHeader('x-frame-options', 'DENY');
requireHeader('referrer-policy', 'no-referrer');
requireHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
requireHeader('cross-origin-opener-policy', 'same-origin-allow-popups');
requireHeader('cross-origin-resource-policy', 'same-origin');

const hsts = globalHeaders.get('strict-transport-security') ?? '';
if (!hsts.includes('max-age=31536000') || !hsts.includes('includeSubDomains')) {
  violations.push('Hosting must send one-year HSTS with includeSubDomains.');
}

const indexCacheControl = indexHeaders.get('cache-control') ?? '';
if (!indexCacheControl.includes('no-cache') || !indexCacheControl.includes('no-store')) {
  violations.push('index.html must use no-cache and no-store so releases are not pinned by browser cache.');
}

const assetCacheControl = assetHeaders.get('cache-control') ?? '';
if (!assetCacheControl.includes('immutable')) {
  violations.push('Hashed assets must keep immutable caching.');
}

if (violations.length > 0) {
  console.error('Firebase Hosting security guard failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Firebase Hosting security guard passed.');

function requireHeader(name, expectedValue) {
  if (globalHeaders.get(name) !== expectedValue) {
    violations.push(`Hosting must send ${name}: ${expectedValue}.`);
  }
}

function getHeaderMap(source) {
  const rule = headers.find((item) => item.source === source);
  const map = new Map();

  for (const header of rule?.headers ?? []) {
    map.set(String(header.key).toLowerCase(), String(header.value));
  }

  return map;
}
