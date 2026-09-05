import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { firebaseStorage } from '../../firebase/firebase';

export type ResourceImageKind = 'inventory' | 'equipment';

const maximumImageBytes = 5 * 1024 * 1024;
const supportedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const imageIndexCache = new Map<ResourceImageKind, Set<string>>();
const imageIndexRequests = new Map<ResourceImageKind, Promise<Set<string>>>();
const imageUrlCache = new Map<string, string | null>();

export function validateResourceImage(file: File): string | null {
  if (!supportedImageTypes.has(file.type)) {
    return 'Choose a JPEG, PNG, or WebP image.';
  }

  if (file.size > maximumImageBytes) {
    return 'Images must be 5 MB or smaller.';
  }

  return null;
}

export async function uploadResourceImage(
  kind: ResourceImageKind,
  resourceId: string,
  file: File,
): Promise<void> {
  const imageRef = getResourceImageReference(kind, resourceId);

  await uploadBytes(imageRef, file, {
    contentType: file.type,
    cacheControl: 'private,max-age=3600',
  });

  markImagePresent(kind, resourceId);
}

export async function getResourceImageUrl(
  kind: ResourceImageKind,
  resourceId: string,
): Promise<string | null> {
  const cacheKey = getImageCacheKey(kind, resourceId);
  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey) ?? null;
  }

  try {
    const imageIds = await getResourceImageIndex(kind);
    if (!imageIds.has(resourceId)) {
      imageUrlCache.set(cacheKey, null);
      return null;
    }

    const url = await getDownloadURL(getResourceImageReference(kind, resourceId));
    imageUrlCache.set(cacheKey, url);
    return url;
  } catch (error) {
    if (isMissingObjectError(error)) {
      markImageAbsent(kind, resourceId);
    }

    // Registry cards should fall back to their placeholder instead of spinning or retrying.
    return null;
  }
}

export async function removeResourceImage(
  kind: ResourceImageKind,
  resourceId: string,
): Promise<void> {
  try {
    await deleteObject(getResourceImageReference(kind, resourceId));
  } catch (error) {
    if (!isMissingObjectError(error)) {
      throw error;
    }
  }

  markImageAbsent(kind, resourceId);
}

export function getResourceImageErrorMessage(error: unknown): string {
  const code = readStorageCode(error);

  if (code === 'storage/unauthenticated') {
    return 'Your session is no longer authenticated. Sign in again before uploading an image.';
  }

  if (code === 'storage/unauthorized') {
    return 'Firebase Storage denied this image operation. Deploy the current Storage rules and confirm this account is active staff or admin.';
  }

  if (code === 'storage/bucket-not-found' || code === 'storage/no-default-bucket') {
    return 'The Firebase Storage bucket is not available for this project.';
  }

  if (code === 'storage/project-not-found') {
    return 'The Firebase project for image storage could not be found.';
  }

  if (code === 'storage/quota-exceeded') {
    return 'Firebase Storage is unavailable because its project quota or billing requirement has been reached.';
  }

  if (code === 'storage/retry-limit-exceeded') {
    return 'Firebase Storage did not respond in time. Check the Storage bucket, billing, CORS configuration, and connection before trying again.';
  }

  if (code === 'storage/canceled') {
    return 'The image upload was cancelled.';
  }

  return 'The image could not be saved. Verify Firebase Storage is initialized and reachable, then try again.';
}

async function getResourceImageIndex(kind: ResourceImageKind): Promise<Set<string>> {
  const cached = imageIndexCache.get(kind);
  if (cached) return cached;

  const existingRequest = imageIndexRequests.get(kind);
  if (existingRequest) return existingRequest;

  const request = listAll(ref(firebaseStorage, kind))
    .then((result) => {
      const imageIds = new Set(result.prefixes.map((prefix) => prefix.name));
      imageIndexCache.set(kind, imageIds);
      return imageIds;
    })
    .finally(() => {
      imageIndexRequests.delete(kind);
    });

  imageIndexRequests.set(kind, request);
  return request;
}

function getResourceImageReference(kind: ResourceImageKind, resourceId: string) {
  return ref(firebaseStorage, `${kind}/${resourceId}/item-image`);
}

function getImageCacheKey(kind: ResourceImageKind, resourceId: string) {
  return `${kind}:${resourceId}`;
}

function markImagePresent(kind: ResourceImageKind, resourceId: string) {
  imageIndexCache.get(kind)?.add(resourceId);
  imageUrlCache.delete(getImageCacheKey(kind, resourceId));
}

function markImageAbsent(kind: ResourceImageKind, resourceId: string) {
  imageIndexCache.get(kind)?.delete(resourceId);
  imageUrlCache.set(getImageCacheKey(kind, resourceId), null);
}

function readStorageCode(error: unknown): string | null {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && typeof error.code === 'string'
    ? error.code
    : null;
}

function isMissingObjectError(error: unknown): boolean {
  return readStorageCode(error) === 'storage/object-not-found';
}
