export type Offer = {
  price: number;
  warrantyMonths: number;
  shippingDays: number;
  extras: string[];
};

export type NegotiationStatus =
  | "NEGOTIATING"
  | "TERMS_ACCEPTED"
  | "CLOSED";

export type NegotiationRound = {
  number: number;
  buyerOffer?: Offer;
  sellerOffer: Offer;
  outcome: "OPENED" | "COUNTERED" | "ACCEPTED" | "REJECTED";
};

export type Negotiation = {
  id: string;
  productId: string;
  sellerId: string;
  status: NegotiationStatus;
  currentOffer: Offer;
  rounds: NegotiationRound[];
  roundsRemaining: number;
};

export type CounterofferInput = {
  price: number;
  warrantyMonths: number;
  shippingDays: number;
};

export type NegotiationResult = {
  negotiation: Negotiation;
  outcome: "ACCEPTED" | "COUNTERED" | "REJECTED";
  message: string;
};

export type SellerPolicy = {
  minimumPrice: number;
  maximumWarrantyMonths: number;
  minimumShippingDays: number;
  concessionStep: number;
  maxRounds: number;
};
