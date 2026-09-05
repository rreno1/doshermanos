import {
  getResourceImageErrorMessage,
  getResourceImageUrl,
  removeResourceImage,
  uploadResourceImage,
  validateResourceImage,
} from './resource-image.service';

export const validateInventoryImage = validateResourceImage;

export function uploadInventoryImage(
  inventoryItemId: string,
  file: File,
): Promise<void> {
  return uploadResourceImage('inventory', inventoryItemId, file);
}

export function getInventoryImageUrl(
  inventoryItemId: string,
): Promise<string | null> {
  return getResourceImageUrl('inventory', inventoryItemId);
}

export function removeInventoryImage(inventoryItemId: string): Promise<void> {
  return removeResourceImage('inventory', inventoryItemId);
}

export { getResourceImageErrorMessage as getInventoryImageErrorMessage };
