import type { Offer } from "@/lib/negotiation/types";

export type AgreementStatus =
  | "AWAITING_HUMAN_APPROVAL"
  | "APPROVED"
  | "COMMITTED"
  | "REJECTED";

export type Agreement = {
  id: string;
  negotiationId: string;
  productId: string;
  terms: Offer;
  termsHash: string;
  status: AgreementStatus;
  approvedAt?: string;
  committedAt?: string;
  transactionId?: string;
};

export type CommitResult =
  | {
      success: true;
      agreement: Agreement;
      transactionId: string;
    }
  | {
      success: false;
      error: "HUMAN_APPROVAL_REQUIRED" | "TERMS_CHANGED";
      agreement: Agreement;
    };
