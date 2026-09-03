import type { Negotiation, Offer } from "../negotiation/types";
import type { Agreement, CommitResult } from "./types";

function fingerprint(negotiationId: string, terms: Offer) {
  const source = [
    negotiationId,
    terms.price,
    terms.warrantyMonths,
    terms.shippingDays,
    [...terms.extras].sort().join(","),
  ].join("|");

  let hash = 2_166_136_261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return `terms-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function prepareAgreement(negotiation: Negotiation): Agreement {
  if (negotiation.status !== "TERMS_ACCEPTED") {
    throw new Error("Only accepted negotiation terms can be prepared");
  }

  const terms = {
    ...negotiation.currentOffer,
    extras: [...negotiation.currentOffer.extras],
  };

  return {
    id: `agr-${negotiation.id}`,
    negotiationId: negotiation.id,
    productId: negotiation.productId,
    terms,
    termsHash: fingerprint(negotiation.id, terms),
    status: "AWAITING_HUMAN_APPROVAL",
  };
}

export function approveAgreement(
  agreement: Agreement,
  approvedAt = new Date().toISOString(),
): Agreement {
  if (agreement.status !== "AWAITING_HUMAN_APPROVAL") {
    throw new Error("Agreement is not awaiting human approval");
  }

  return {
    ...agreement,
    status: "APPROVED",
    approvedAt,
  };
}

export function rejectAgreement(agreement: Agreement): Agreement {
  if (agreement.status !== "AWAITING_HUMAN_APPROVAL") {
    throw new Error("Agreement is not awaiting human approval");
  }

  return {
    ...agreement,
    status: "REJECTED",
  };
}

export function commitAgreement(
  agreement: Agreement,
  currentNegotiation: Negotiation,
  committedAt = new Date().toISOString(),
): CommitResult {
  if (agreement.status !== "APPROVED") {
    return {
      success: false,
      error: "HUMAN_APPROVAL_REQUIRED",
      agreement,
    };
  }

  const currentHash = fingerprint(
    currentNegotiation.id,
    currentNegotiation.currentOffer,
  );

  if (currentHash !== agreement.termsHash) {
    return {
      success: false,
      error: "TERMS_CHANGED",
      agreement: {
        ...agreement,
        status: "AWAITING_HUMAN_APPROVAL",
        approvedAt: undefined,
      },
    };
  }

  const transactionId = `deal-${agreement.id.replace("agr-neg-", "")}`;
  const committedAgreement: Agreement = {
    ...agreement,
    status: "COMMITTED",
    committedAt,
    transactionId,
  };

  return {
    success: true,
    agreement: committedAgreement,
    transactionId,
  };
}
