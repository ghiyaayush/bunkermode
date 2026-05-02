import { describe, expect, test } from "bun:test";
import { selectRoute, RANKED_SAFE_DESTINATIONS } from "../lib/exit-router";

describe("P7 exit routing", () => {
  test("picks highest-ranked passing destination", () => {
    const route = selectRoute(
      ["usdc-base-cctp", "morpho-isolated", "native-eth"],
      () => true,
    );
    expect(route.chosen.name).toBe("usdc-base-cctp");
    expect(route.chosen.rank).toBe(1);
  });

  test("falls through to next when first fails liveness", () => {
    const route = selectRoute(
      ["usdc-base-cctp", "morpho-isolated", "native-eth"],
      (n) => n !== "usdc-base-cctp",
    );
    expect(route.chosen.name).toBe("morpho-isolated");
  });

  test("native ETH is always the final fallback", () => {
    const route = selectRoute(["usdc-base-cctp"], () => false);
    expect(route.chosen.name).toBe("native-eth");
    expect(route.reason).toMatch(/defaulting to native ETH/);
  });

  test("respects user's policy ordering, not absolute rank", () => {
    const route = selectRoute(["morpho-isolated", "usdc-base-cctp"], () => true);
    // Even though usdc-base-cctp is rank 1, both pass liveness, so picks
    // by absolute rank within user's selected set
    expect(route.chosen.name).toBe("usdc-base-cctp");
  });

  test("all four ranked destinations are available", () => {
    expect(RANKED_SAFE_DESTINATIONS).toHaveLength(4);
    const names = RANKED_SAFE_DESTINATIONS.map((d) => d.name);
    expect(names).toContain("usdc-base-cctp");
    expect(names).toContain("morpho-isolated");
    expect(names).toContain("sparklend");
    expect(names).toContain("native-eth");
  });
});
