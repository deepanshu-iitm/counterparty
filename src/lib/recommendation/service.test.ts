import { describe, expect, it } from "vitest";
import { searchProducts } from "../catalog/service";
import { startNegotiation, submitCounteroffer } from "../negotiation/engine";
import { recommendDeal } from "./service";

const products = searchProducts();
const negotiations = [
  submitCounteroffer(startNegotiation("forgebook-pro"), {
    price: 1_775,
    warrantyMonths: 24,
    shippingDays: 5,
  }).negotiation,
  submitCounteroffer(startNegotiation("nova-slate-x"), {
    price: 1_795,
    warrantyMonths: 24,
    shippingDays: 3,
  }).negotiation,
  submitCounteroffer(startNegotiation("gearframe-16"), {
    price: 1_730,
    warrantyMonths: 6,
    shippingDays: 2,
  }).negotiation,
];

describe("deal recommendation", () => {
  it("chooses the lowest offer for value", () => {
    expect(
      recommendDeal(negotiations, products, "value")?.product.id,
    ).toBe("gearframe-16");
  });

  it("changes to the strongest seller among top warranties", () => {
    expect(
      recommendDeal(negotiations, products, "warranty")?.product.id,
    ).toBe("forgebook-pro");
  });

  it("chooses the quickest fulfillment for delivery", () => {
    expect(
      recommendDeal(negotiations, products, "delivery")?.product.id,
    ).toBe("gearframe-16");
  });
});
