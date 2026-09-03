export type SellerProfile = {
  id: string;
  name: string;
  reputation: number;
  completedDeals: number;
  specialty: string;
};

export type Product = {
  id: string;
  sellerId: string;
  name: string;
  eyebrow: string;
  description: string;
  specs: {
    processor: string;
    ramGb: number;
    storageGb: number;
    batteryHours: number;
  };
  listPrice: number;
  inventory: number;
  shippingDays: number;
  warrantyMonths: number;
  negotiable: boolean;
};

export type ProductWithSeller = Product & {
  seller: SellerProfile;
};

export type ProductSearch = {
  query?: string;
  maxPrice?: number;
  minimumRamGb?: number;
  minimumWarrantyMonths?: number;
  sortBy?: "value" | "price" | "warranty" | "delivery";
};
