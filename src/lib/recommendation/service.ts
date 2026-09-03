import type { ProductWithSeller } from "../catalog/types";
import type { Negotiation } from "../negotiation/types";

export type DealPreference = "value" | "warranty" | "delivery";

export type Recommendation = {
  negotiation: Negotiation;
  product: ProductWithSeller;
  reason: string;
};

export function recommendDeal(
  negotiations: Negotiation[],
  products: ProductWithSeller[],
  preference: DealPreference,
): Recommendation | null {
  const productById = new Map(products.map((product) => [product.id, product]));
  const candidates = negotiations
    .filter((negotiation) => negotiation.status !== "CLOSED")
    .map((negotiation) => ({
      negotiation,
      product: productById.get(negotiation.productId),
    }))
    .filter(
      (
        candidate,
      ): candidate is {
        negotiation: Negotiation;
        product: ProductWithSeller;
      } => Boolean(candidate.product),
    );

  if (candidates.length === 0) return null;

  const ranked = candidates.toSorted((left, right) => {
    const leftOffer = left.negotiation.currentOffer;
    const rightOffer = right.negotiation.currentOffer;

    if (preference === "warranty") {
      return (
        rightOffer.warrantyMonths - leftOffer.warrantyMonths ||
        right.product.seller.reputation - left.product.seller.reputation ||
        leftOffer.price - rightOffer.price
      );
    }

    if (preference === "delivery") {
      return (
        leftOffer.shippingDays - rightOffer.shippingDays ||
        leftOffer.price - rightOffer.price
      );
    }

    return (
      leftOffer.price - rightOffer.price ||
      rightOffer.warrantyMonths - leftOffer.warrantyMonths
    );
  });

  const winner = ranked[0];
  const offer = winner.negotiation.currentOffer;
  const reason =
    preference === "warranty"
      ? `${offer.warrantyMonths}-month warranty from the highest-rated matching seller`
      : preference === "delivery"
        ? `${offer.shippingDays}-day delivery is the fastest active option`
        : `$${offer.price.toLocaleString("en-US")} is the lowest active offer`;

  return { ...winner, reason };
}
