import { describe, expect, it } from "vitest";
import {
  approveAgreement,
  commitAgreement,
  prepareAgreement,
} from "./agreements/service";
import { searchProducts } from "./catalog/service";
import { startNegotiation, submitCounteroffer } from "./negotiation/engine";
import { recommendDeal } from "./recommendation/service";

describe("Counterparty golden path", () => {
  it("adapts to human judgment and requires approval before commitment", () => {
    const products = searchProducts({
      maxPrice: 1_800,
      minimumRamGb: 32,
      sortBy: "value",
    });

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

    const valueChoice = recommendDeal(negotiations, products, "value");
    expect(valueChoice?.product.id).toBe("gearframe-16");

    const warrantyChoice = recommendDeal(negotiations, products, "warranty");
    expect(warrantyChoice?.product.id).toBe("forgebook-pro");

    const prepared = prepareAgreement(warrantyChoice!.negotiation);
    expect(commitAgreement(prepared, warrantyChoice!.negotiation)).toMatchObject({
      success: false,
      error: "HUMAN_APPROVAL_REQUIRED",
    });

    const approved = approveAgreement(prepared);
    expect(commitAgreement(approved, warrantyChoice!.negotiation)).toMatchObject({
      success: true,
      transactionId: "deal-forgebook-pro",
      agreement: { status: "COMMITTED" },
    });
  });
});
