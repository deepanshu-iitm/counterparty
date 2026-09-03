import type { Product, SellerProfile } from "./types";

export const sellers: SellerProfile[] = [
  {
    id: "byte-market",
    name: "ByteMarket",
    reputation: 4.9,
    completedDeals: 12_480,
    specialty: "Flexible protection plans",
  },
  {
    id: "nova-tech",
    name: "NovaTech",
    reputation: 4.8,
    completedDeals: 8_920,
    specialty: "Fast, reliable delivery",
  },
  {
    id: "gear-hub",
    name: "GearHub",
    reputation: 4.6,
    completedDeals: 18_230,
    specialty: "Aggressive pricing",
  },
];

export const products: Product[] = [
  {
    id: "forgebook-pro",
    sellerId: "byte-market",
    name: "ForgeBook Pro 14",
    eyebrow: "Best protection",
    description:
      "A balanced developer workstation backed by ByteMarket's flexible warranty program.",
    specs: {
      processor: "Ryzen 9 8945HS",
      ramGb: 32,
      storageGb: 1_000,
      batteryHours: 13,
    },
    listPrice: 1_899,
    inventory: 8,
    shippingDays: 5,
    warrantyMonths: 12,
    negotiable: true,
  },
  {
    id: "nova-slate-x",
    sellerId: "nova-tech",
    name: "Nova Slate X",
    eyebrow: "Fastest delivery",
    description:
      "A lightweight development machine with expedited fulfillment and premium support.",
    specs: {
      processor: "Intel Core Ultra 9",
      ramGb: 32,
      storageGb: 1_000,
      batteryHours: 15,
    },
    listPrice: 1_850,
    inventory: 5,
    shippingDays: 3,
    warrantyMonths: 12,
    negotiable: true,
  },
  {
    id: "gearframe-16",
    sellerId: "gear-hub",
    name: "GearFrame 16",
    eyebrow: "Lowest price",
    description:
      "A high-performance workstation with the strongest initial price and a shorter warranty.",
    specs: {
      processor: "Ryzen 9 9955HX",
      ramGb: 64,
      storageGb: 1_000,
      batteryHours: 8,
    },
    listPrice: 1_820,
    inventory: 12,
    shippingDays: 2,
    warrantyMonths: 6,
    negotiable: true,
  },
];
