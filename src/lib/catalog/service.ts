import { products, sellers } from "./data";
import type { ProductSearch, ProductWithSeller } from "./types";

const sellerById = new Map(sellers.map((seller) => [seller.id, seller]));

function hydrateProduct(productId: string): ProductWithSeller {
  const product = products.find((candidate) => candidate.id === productId);

  if (!product) {
    throw new Error(`Unknown product: ${productId}`);
  }

  const seller = sellerById.get(product.sellerId);

  if (!seller) {
    throw new Error(`Missing seller for product: ${productId}`);
  }

  return { ...product, seller };
}

function valueScore(product: ProductWithSeller) {
  const warrantyValue = product.warrantyMonths * 4;
  const reputationValue = product.seller.reputation * 45;
  const deliveryPenalty = product.shippingDays * 9;

  return (
    (product.specs.ramGb * 3 +
      product.specs.batteryHours * 5 +
      warrantyValue +
      reputationValue -
      deliveryPenalty) /
    product.listPrice
  );
}

export function getProduct(productId: string): ProductWithSeller {
  return hydrateProduct(productId);
}

export function searchProducts(search: ProductSearch = {}): ProductWithSeller[] {
  const normalizedQuery = search.query?.trim().toLowerCase();

  const matches = products
    .map((product) => hydrateProduct(product.id))
    .filter((product) => {
      const searchableText = [
        product.name,
        product.description,
        product.specs.processor,
        product.seller.name,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        (search.maxPrice === undefined ||
          product.listPrice <=
            search.maxPrice * (product.negotiable ? 1.1 : 1)) &&
        (search.minimumRamGb === undefined ||
          product.specs.ramGb >= search.minimumRamGb) &&
        (search.minimumWarrantyMonths === undefined ||
          product.warrantyMonths >= search.minimumWarrantyMonths)
      );
    });

  return matches.toSorted((left, right) => {
    switch (search.sortBy) {
      case "price":
        return left.listPrice - right.listPrice;
      case "warranty":
        return right.warrantyMonths - left.warrantyMonths;
      case "delivery":
        return left.shippingDays - right.shippingDays;
      case "value":
      default:
        return valueScore(right) - valueScore(left);
    }
  });
}
