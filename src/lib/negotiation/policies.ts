import type { SellerPolicy } from "./types";

export const sellerPolicies: Record<string, SellerPolicy> = {
  "byte-market": {
    minimumPrice: 1_775,
    maximumWarrantyMonths: 24,
    minimumShippingDays: 5,
    concessionStep: 42,
    maxRounds: 4,
  },
  "nova-tech": {
    minimumPrice: 1_795,
    maximumWarrantyMonths: 24,
    minimumShippingDays: 3,
    concessionStep: 20,
    maxRounds: 4,
  },
  "gear-hub": {
    minimumPrice: 1_730,
    maximumWarrantyMonths: 6,
    minimumShippingDays: 2,
    concessionStep: 45,
    maxRounds: 4,
  },
};
