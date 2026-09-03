import { describe, expect, it } from "vitest";
import { startNegotiation, submitCounteroffer } from "../negotiation/engine";
import {
  approveAgreement,
  commitAgreement,
  prepareAgreement,
} from "./service";

function acceptedNegotiation() {
  return submitCounteroffer(startNegotiation("forgebook-pro"), {
    price: 1_775,
    warrantyMonths: 24,
    shippingDays: 5,
  }).negotiation;
}

describe("agreement authority boundary", () => {
  it("prepares accepted terms for human review", () => {
    const agreement = prepareAgreement(acceptedNegotiation());

    expect(agreement.status).toBe("AWAITING_HUMAN_APPROVAL");
    expect(agreement.termsHash).toMatch(/^terms-[a-f0-9]{8}$/);
  });

  it("blocks commitment until a human approves", () => {
    const negotiation = acceptedNegotiation();
    const agreement = prepareAgreement(negotiation);

    expect(commitAgreement(agreement, negotiation)).toMatchObject({
      success: false,
      error: "HUMAN_APPROVAL_REQUIRED",
    });
  });

  it("commits the exact terms after approval", () => {
    const negotiation = acceptedNegotiation();
    const agreement = approveAgreement(
      prepareAgreement(negotiation),
      "2026-09-03T07:00:00.000Z",
    );
    const result = commitAgreement(
      agreement,
      negotiation,
      "2026-09-03T07:01:00.000Z",
    );

    expect(result.success).toBe(true);
    expect(result.agreement.status).toBe("COMMITTED");
    expect(result.agreement.transactionId).toBe("deal-forgebook-pro");
  });

  it("invalidates approval when commercial terms change", () => {
    const negotiation = acceptedNegotiation();
    const agreement = approveAgreement(prepareAgreement(negotiation));
    const changedNegotiation = {
      ...negotiation,
      currentOffer: { ...negotiation.currentOffer, price: 1_776 },
    };
    const result = commitAgreement(agreement, changedNegotiation);

    expect(result).toMatchObject({
      success: false,
      error: "TERMS_CHANGED",
      agreement: { status: "AWAITING_HUMAN_APPROVAL" },
    });
  });
});
