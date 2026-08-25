import {
  deleteObject,
  getDownloadURL,
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
const imageLookupTimeoutMs = 4000;

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
): Promise<string> {
  const imageRef = getResourceImageReference(kind, resourceId);

  await uploadBytes(imageRef, file, {
    contentType: file.type,
    cacheControl: 'private,max-age=3600',
  });

  return getDownloadURL(imageRef);
}

export async function getResourceImageUrl(
  kind: ResourceImageKind,
  resourceId: string,
): Promise<string | null> {
  try {
    return await withTimeout(
      getDownloadURL(getResourceImageReference(kind, resourceId)),
      imageLookupTimeoutMs,
    );
  } catch (error) {
    if (isMissingObjectError(error) || isLookupTimeout(error)) {
      return null;
    }

    // A card should degrade to its placeholder instead of remaining in a loading state.
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
}

export function getResourceImageErrorMessage(error: unknown): string {
  const code = readStorageCode(error);

  if (code === 'storage/unauthorized') {
    return 'The image could not be uploaded because Firebase Storage denied access. Deploy the current Storage rules and try again.';
  }

  if (code === 'storage/bucket-not-found') {
    return 'The Firebase Storage bucket is not available for this project.';
  }

  if (code === 'storage/retry-limit-exceeded') {
    return 'The image upload timed out. Check the connection and try again.';
  }

  if (code === 'storage/canceled') {
    return 'The image upload was cancelled.';
  }

  return 'The image could not be uploaded. Check Firebase Storage and try again.';
}

function getResourceImageReference(kind: ResourceImageKind, resourceId: string) {
  return ref(firebaseStorage, `${kind}/${resourceId}/item-image`);
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

function isLookupTimeout(error: unknown): boolean {
  return error instanceof Error && error.message === 'resource-image-lookup-timeout';
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(
      () => reject(new Error('resource-image-lookup-timeout')),
      timeoutMs,
    );

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}
