import { describe, expect, it } from "vitest";
import { startNegotiation, submitCounteroffer } from "./engine";

describe("negotiation engine", () => {
  it("opens with the seller's public listing terms", () => {
    const negotiation = startNegotiation("forgebook-pro");

    expect(negotiation.status).toBe("NEGOTIATING");
    expect(negotiation.currentOffer).toMatchObject({
      price: 1_899,
      warrantyMonths: 12,
      shippingDays: 5,
    });
    expect(negotiation.roundsRemaining).toBe(4);
  });

  it("returns a seller counter without exposing private policy", () => {
    const negotiation = startNegotiation("forgebook-pro");
    const result = submitCounteroffer(negotiation, {
      price: 1_700,
      warrantyMonths: 24,
      shippingDays: 5,
    });

    expect(result.outcome).toBe("COUNTERED");
    expect(result.negotiation.currentOffer).toEqual({
      price: 1_857,
      warrantyMonths: 24,
      shippingDays: 5,
      extras: ["Free insured shipping"],
    });
    expect(result.negotiation).not.toHaveProperty("policy");
    expect(result.negotiation).not.toHaveProperty("minimumPrice");
  });

  it("accepts terms within the seller's private boundaries", () => {
    const negotiation = startNegotiation("forgebook-pro");
    const result = submitCounteroffer(negotiation, {
      price: 1_775,
      warrantyMonths: 24,
      shippingDays: 5,
    });

    expect(result.outcome).toBe("ACCEPTED");
    expect(result.negotiation.status).toBe("TERMS_ACCEPTED");
    expect(result.negotiation.currentOffer.price).toBe(1_775);
  });

  it("preserves meaningful seller differences", () => {
    const warrantySeller = submitCounteroffer(
      startNegotiation("forgebook-pro"),
      { price: 1_775, warrantyMonths: 24, shippingDays: 5 },
    );
    const priceSeller = submitCounteroffer(
      startNegotiation("gearframe-16"),
      { price: 1_730, warrantyMonths: 24, shippingDays: 2 },
    );

    expect(warrantySeller.outcome).toBe("ACCEPTED");
    expect(priceSeller.outcome).toBe("COUNTERED");
    expect(priceSeller.negotiation.currentOffer.warrantyMonths).toBe(6);
  });

  it("rejects malformed commercial terms", () => {
    expect(() =>
      submitCounteroffer(startNegotiation("nova-slate-x"), {
        price: Number.NaN,
        warrantyMonths: 24,
        shippingDays: 3,
      }),
    ).toThrow("positive, finite values");
  });
});
