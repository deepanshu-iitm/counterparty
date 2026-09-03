import { getProduct } from "../catalog/service";
import { sellerPolicies } from "./policies";
import type {
  CounterofferInput,
  Negotiation,
  NegotiationResult,
  Offer,
} from "./types";

function getPolicy(sellerId: string) {
  const policy = sellerPolicies[sellerId];

  if (!policy) {
    throw new Error(`Seller ${sellerId} does not support negotiation`);
  }

  return policy;
}

function sanitizeOffer(offer: CounterofferInput): CounterofferInput {
  if (
    !Number.isFinite(offer.price) ||
    !Number.isInteger(offer.warrantyMonths) ||
    !Number.isInteger(offer.shippingDays) ||
    offer.price <= 0 ||
    offer.warrantyMonths <= 0 ||
    offer.shippingDays <= 0
  ) {
    throw new Error("Offer terms must be positive, finite values");
  }

  return {
    price: Math.round(offer.price),
    warrantyMonths: offer.warrantyMonths,
    shippingDays: offer.shippingDays,
  };
}

export function startNegotiation(productId: string): Negotiation {
  const product = getProduct(productId);
  const policy = getPolicy(product.sellerId);
  const openingOffer: Offer = {
    price: product.listPrice,
    warrantyMonths: product.warrantyMonths,
    shippingDays: product.shippingDays,
    extras: [],
  };

  return {
    id: `neg-${product.id}`,
    productId: product.id,
    sellerId: product.sellerId,
    status: "NEGOTIATING",
    currentOffer: openingOffer,
    roundsRemaining: policy.maxRounds,
    rounds: [
      {
        number: 0,
        sellerOffer: openingOffer,
        outcome: "OPENED",
      },
    ],
  };
}

export function submitCounteroffer(
  negotiation: Negotiation,
  rawOffer: CounterofferInput,
): NegotiationResult {
  if (negotiation.status !== "NEGOTIATING") {
    throw new Error(`Negotiation ${negotiation.id} is not active`);
  }

  const offer = sanitizeOffer(rawOffer);
  const policy = getPolicy(negotiation.sellerId);
  const roundNumber = negotiation.rounds.length;
  const canAccept =
    offer.price >= policy.minimumPrice &&
    offer.warrantyMonths <= policy.maximumWarrantyMonths &&
    offer.shippingDays >= policy.minimumShippingDays;

  if (canAccept) {
    const acceptedOffer: Offer = { ...offer, extras: ["Free insured shipping"] };
    const updated: Negotiation = {
      ...negotiation,
      status: "TERMS_ACCEPTED",
      currentOffer: acceptedOffer,
      roundsRemaining: negotiation.roundsRemaining - 1,
      rounds: [
        ...negotiation.rounds,
        {
          number: roundNumber,
          buyerOffer: { ...offer, extras: [] },
          sellerOffer: acceptedOffer,
          outcome: "ACCEPTED",
        },
      ],
    };

    return {
      negotiation: updated,
      outcome: "ACCEPTED",
      message: "Seller accepted the proposed terms.",
    };
  }

  if (negotiation.roundsRemaining <= 1) {
    const closed: Negotiation = {
      ...negotiation,
      status: "CLOSED",
      roundsRemaining: 0,
      rounds: [
        ...negotiation.rounds,
        {
          number: roundNumber,
          buyerOffer: { ...offer, extras: [] },
          sellerOffer: negotiation.currentOffer,
          outcome: "REJECTED",
        },
      ],
    };

    return {
      negotiation: closed,
      outcome: "REJECTED",
      message: "Seller ended the negotiation without an agreement.",
    };
  }

  const sellerCounter: Offer = {
    price: Math.max(
      policy.minimumPrice,
      negotiation.currentOffer.price - policy.concessionStep,
    ),
    warrantyMonths: Math.min(
      offer.warrantyMonths,
      policy.maximumWarrantyMonths,
    ),
    shippingDays: Math.max(offer.shippingDays, policy.minimumShippingDays),
    extras:
      offer.warrantyMonths <= policy.maximumWarrantyMonths
        ? ["Free insured shipping"]
        : [],
  };

  const updated: Negotiation = {
    ...negotiation,
    currentOffer: sellerCounter,
    roundsRemaining: negotiation.roundsRemaining - 1,
    rounds: [
      ...negotiation.rounds,
      {
        number: roundNumber,
        buyerOffer: { ...offer, extras: [] },
        sellerOffer: sellerCounter,
        outcome: "COUNTERED",
      },
    ],
  };

  return {
    negotiation: updated,
    outcome: "COUNTERED",
    message: "Seller returned a structured counteroffer.",
  };
}
