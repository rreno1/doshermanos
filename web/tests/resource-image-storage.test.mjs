import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const imageServiceSource = await readFile(
  new URL('../src/features/resources/resource-image.service.ts', import.meta.url),
  'utf8',
);
const firebaseSource = await readFile(
  new URL('../src/firebase/firebase.ts', import.meta.url),
  'utf8',
);
const storageRulesSource = await readFile(
  new URL('../../firebase/storage.rules', import.meta.url),
  'utf8',
);
const corsSource = await readFile(
  new URL('../../firebase/storage.cors.json', import.meta.url),
  'utf8',
);

test('resource cards share one Storage index instead of probing every missing image', () => {
  assert.match(imageServiceSource, /listAll\(ref\(firebaseStorage, kind\)\)/);
  assert.match(imageServiceSource, /imageIndexCache/);
  assert.match(imageServiceSource, /imageIndexRequests/);
  assert.match(imageServiceSource, /result\.prefixes\.map/);
});

test('image upload completes after upload rather than waiting for another download lookup', () => {
  const uploadFunction = imageServiceSource.slice(
    imageServiceSource.indexOf('export async function uploadResourceImage'),
    imageServiceSource.indexOf('export async function getResourceImageUrl'),
  );

  assert.match(uploadFunction, /await uploadBytes/);
  assert.doesNotMatch(uploadFunction, /getDownloadURL/);
  assert.match(uploadFunction, /markImagePresent/);
});

test('Firebase Storage retries are bounded so failures cannot spin for minutes', () => {
  assert.match(firebaseSource, /maxOperationRetryTime = 5_000/);
  assert.match(firebaseSource, /maxUploadRetryTime = 30_000/);
});

test('Storage rules allow only authenticated staff and admin to list resource image folders', () => {
  assert.match(storageRulesSource, /match \/inventory\/\{allPaths=\*\*\}[\s\S]*allow list: if isStaffOrAdmin\(\)/);
  assert.match(storageRulesSource, /match \/equipment\/\{allPaths=\*\*\}[\s\S]*allow list: if isStaffOrAdmin\(\)/);
  assert.match(storageRulesSource, /allow create, update: if isStaffOrAdmin\(\) && isAllowedImage\(\)/);
});

test('bucket CORS policy is restricted to the deployed Firebase Hosting origins', () => {
  const cors = JSON.parse(corsSource);
  assert.equal(cors.length, 1);
  assert.deepEqual(cors[0].origin, [
    'https://dos-hermanos-hilongos.web.app',
    'https://dos-hermanos-hilongos.firebaseapp.com',
  ]);
  assert.ok(cors[0].method.includes('GET'));
  assert.ok(cors[0].method.includes('POST'));
  assert.ok(cors[0].method.includes('PUT'));
  assert.ok(cors[0].method.includes('DELETE'));
});
