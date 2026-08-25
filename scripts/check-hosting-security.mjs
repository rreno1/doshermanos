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
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
]) {
  if (!contentSecurityPolicy.includes(directive)) {
    violations.push(`Content-Security-Policy must contain: ${directive}`);
  }
}

if (globalHeaders.get('x-content-type-options') !== 'nosniff') {
  violations.push('Hosting must send X-Content-Type-Options: nosniff.');
}

if (globalHeaders.get('x-frame-options') !== 'DENY') {
  violations.push('Hosting must send X-Frame-Options: DENY.');
}

if (!globalHeaders.has('strict-transport-security')) {
  violations.push('Hosting must send Strict-Transport-Security.');
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

function getHeaderMap(source) {
  const rule = headers.find((item) => item.source === source);
  const map = new Map();

  for (const header of rule?.headers ?? []) {
    map.set(String(header.key).toLowerCase(), String(header.value));
  }

  return map;
}
