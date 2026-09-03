import { afterEach, describe, expect, it, vi } from "vitest";
import {
  registerCounterpartyTools,
  type CounterpartyToolActions,
} from "./register";

const createActions = (): CounterpartyToolActions => ({
  searchProducts: vi.fn((input) => ({ input })),
  startNegotiation: vi.fn((productId) => ({ productId })),
  submitCounteroffer: vi.fn((negotiationId, offer) => ({
    negotiationId,
    offer,
  })),
  getNegotiations: vi.fn(() => []),
  prepareAgreement: vi.fn((negotiationId) => ({ negotiationId })),
  commitAgreement: vi.fn((agreementId) => ({ agreementId })),
});

describe("WebMCP registration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gracefully reports browsers without WebMCP", async () => {
    vi.stubGlobal("document", {});

    await expect(
      registerCounterpartyTools(createActions(), new AbortController().signal),
    ).resolves.toEqual({ supported: false, toolCount: 0 });
  });

  it("registers six semantic tools with strict schemas", async () => {
    const registerTool = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("document", { modelContext: { registerTool } });

    const result = await registerCounterpartyTools(
      createActions(),
      new AbortController().signal,
    );
    const definitions = registerTool.mock.calls.map(([definition]) => definition);

    expect(result).toEqual({ supported: true, toolCount: 6 });
    expect(definitions.map(({ name }) => name)).toEqual([
      "search_products",
      "start_negotiation",
      "submit_counteroffer",
      "get_negotiations",
      "prepare_agreement",
      "commit_agreement",
    ]);
    expect(
      definitions.every(
        ({ inputSchema }) => inputSchema.additionalProperties === false,
      ),
    ).toBe(true);
  });
});
