import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { firebaseStorage } from '../../firebase/firebase';

const maximumImageBytes = 5 * 1024 * 1024;
const supportedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function validateInventoryImage(file: File): string | null {
  if (!supportedImageTypes.has(file.type)) {
    return 'Choose a JPEG, PNG, or WebP image.';
  }

  if (file.size > maximumImageBytes) {
    return 'Inventory images must be 5 MB or smaller.';
  }

  return null;
}

export async function uploadInventoryImage(
  inventoryItemId: string,
  file: File,
): Promise<string> {
  const imageRef = getInventoryImageReference(inventoryItemId);

  await uploadBytes(imageRef, file, {
    contentType: file.type,
    cacheControl: 'private,max-age=3600',
  });

  return getDownloadURL(imageRef);
}

export async function getInventoryImageUrl(
  inventoryItemId: string,
): Promise<string | null> {
  try {
    return await getDownloadURL(getInventoryImageReference(inventoryItemId));
  } catch (error) {
    if (isMissingObjectError(error)) {
      return null;
    }

    throw error;
  }
}

export async function removeInventoryImage(inventoryItemId: string): Promise<void> {
  try {
    await deleteObject(getInventoryImageReference(inventoryItemId));
  } catch (error) {
    if (!isMissingObjectError(error)) {
      throw error;
    }
  }
}

function getInventoryImageReference(inventoryItemId: string) {
  return ref(firebaseStorage, `inventory/${inventoryItemId}/item-image`);
}

function isMissingObjectError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'storage/object-not-found';
}
