import type { JsonSchemaForInference } from "@mcp-b/webmcp-types";
import type { ProductSearch } from "@/lib/catalog/types";
import type { CounterofferInput } from "@/lib/negotiation/types";

export type CounterpartyToolActions = {
  searchProducts: (input: ProductSearch) => unknown;
  startNegotiation: (productId: string) => unknown;
  submitCounteroffer: (
    negotiationId: string,
    offer: CounterofferInput,
  ) => unknown;
  getNegotiations: () => unknown;
  prepareAgreement: (negotiationId: string) => unknown;
  commitAgreement: (agreementId: string) => unknown;
};

const searchProductsSchema = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "Optional product name, seller, processor, or use-case query.",
    },
    maxPrice: {
      type: "number",
      minimum: 1,
      description: "Maximum listed price in USD.",
    },
    minimumRamGb: {
      type: "integer",
      minimum: 1,
      description: "Minimum required memory in gigabytes.",
    },
    minimumWarrantyMonths: {
      type: "integer",
      minimum: 1,
      description: "Minimum listed warranty in months.",
    },
    sortBy: {
      type: "string",
      enum: ["value", "price", "warranty", "delivery"],
      description: "How to rank matching products.",
    },
  },
  additionalProperties: false,
} as const satisfies JsonSchemaForInference;

const productIdSchema = {
  type: "object",
  properties: {
    productId: {
      type: "string",
      description: "Exact product identifier returned by search_products.",
    },
  },
  required: ["productId"],
  additionalProperties: false,
} as const satisfies JsonSchemaForInference;

const counterofferSchema = {
  type: "object",
  properties: {
    negotiationId: {
      type: "string",
      description: "Active negotiation identifier.",
    },
    price: {
      type: "number",
      minimum: 1,
      description: "Proposed total purchase price in USD.",
    },
    warrantyMonths: {
      type: "integer",
      minimum: 1,
      description: "Requested warranty term in months.",
    },
    shippingDays: {
      type: "integer",
      minimum: 1,
      description: "Maximum acceptable delivery time in days.",
    },
  },
  required: ["negotiationId", "price", "warrantyMonths", "shippingDays"],
  additionalProperties: false,
} as const satisfies JsonSchemaForInference;

const negotiationIdSchema = {
  type: "object",
  properties: {
    negotiationId: {
      type: "string",
      description: "Negotiation with accepted terms to freeze as an agreement.",
    },
  },
  required: ["negotiationId"],
  additionalProperties: false,
} as const satisfies JsonSchemaForInference;

const agreementIdSchema = {
  type: "object",
  properties: {
    agreementId: {
      type: "string",
      description: "Prepared agreement identifier shown to the human.",
    },
  },
  required: ["agreementId"],
  additionalProperties: false,
} as const satisfies JsonSchemaForInference;

export async function registerCounterpartyTools(
  actions: CounterpartyToolActions,
  signal: AbortSignal,
) {
  if (!document.modelContext) {
    return { supported: false, toolCount: 0 };
  }

  const registrations = [
    document.modelContext.registerTool(
      {
        name: "search_products",
        description:
          "Search Counterparty's live product catalog using structured budget, memory, warranty, and ranking constraints. Use this before negotiating. Returns public product and seller information only.",
        inputSchema: searchProductsSchema,
        execute: (input) => actions.searchProducts(input),
        annotations: { readOnlyHint: true },
      },
      { signal },
    ),
    document.modelContext.registerTool(
      {
        name: "start_negotiation",
        description:
          "Open a stateful negotiation with the seller of one product. Returns the seller's opening terms and a negotiation ID. This does not reserve inventory or create a purchase.",
        inputSchema: productIdSchema,
        execute: ({ productId }) => actions.startNegotiation(productId),
      },
      { signal },
    ),
    document.modelContext.registerTool(
      {
        name: "submit_counteroffer",
        description:
          "Submit structured commercial terms to an active seller negotiation. The seller may accept, reject, or counter according to a private policy. This never creates a binding purchase.",
        inputSchema: counterofferSchema,
        execute: ({ negotiationId, price, warrantyMonths, shippingDays }) =>
          actions.submitCounteroffer(negotiationId, {
            price,
            warrantyMonths,
            shippingDays,
          }),
      },
      { signal },
    ),
    document.modelContext.registerTool(
      {
        name: "get_negotiations",
        description:
          "Read all active and accepted negotiations, including current terms and remaining rounds. Use this to compare counterparties before making a recommendation.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: () => actions.getNegotiations(),
        annotations: { readOnlyHint: true },
      },
      { signal },
    ),
    document.modelContext.registerTool(
      {
        name: "prepare_agreement",
        description:
          "Freeze the accepted terms of one negotiation into a reviewable agreement. The agreement will await explicit human approval and cannot yet be committed.",
        inputSchema: negotiationIdSchema,
        execute: ({ negotiationId }) =>
          actions.prepareAgreement(negotiationId),
      },
      { signal },
    ),
    document.modelContext.registerTool(
      {
        name: "commit_agreement",
        description:
          "Commit a prepared agreement only after the human has explicitly approved its exact terms in the Counterparty interface. Returns HUMAN_APPROVAL_REQUIRED when approval is absent.",
        inputSchema: agreementIdSchema,
        execute: ({ agreementId }) => actions.commitAgreement(agreementId),
      },
      { signal },
    ),
  ];

  await Promise.all(registrations);

  return { supported: true, toolCount: registrations.length };
}
