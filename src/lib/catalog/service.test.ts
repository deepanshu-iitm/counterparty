import { describe, expect, it } from "vitest";
import { getProduct, searchProducts } from "./service";

describe("catalog service", () => {
  it("includes nearby negotiable listings for a target budget", () => {
    const results = searchProducts({
      maxPrice: 1_800,
      minimumRamGb: 32,
      sortBy: "value",
    });

    expect(results).toHaveLength(3);
    expect(results.every((product) => product.negotiable)).toBe(true);
  });

  it("does not reveal private seller policy fields", () => {
    const product = getProduct("forgebook-pro");

    expect(product.seller).not.toHaveProperty("minimumPrice");
    expect(product.seller).not.toHaveProperty("concessionStep");
  });

  it("returns no candidates far outside the target budget", () => {
    expect(searchProducts({ maxPrice: 1_500 })).toEqual([]);
  });
});
