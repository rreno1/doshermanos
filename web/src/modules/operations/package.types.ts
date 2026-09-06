export type CateringPackage = {
  id: string;
  name: string;
  description: string;
  priceInCentavos: number;
  menuHighlights: string[];
  sortOrder: number;
};

export type ManagedCateringPackage = CateringPackage & {
  isActive: boolean;
};

export type PackageInput = {
  name: string;
  description: string;
  priceInCentavos: number;
  menuHighlights: string[];
  sortOrder: number;
  isActive: boolean;
};
