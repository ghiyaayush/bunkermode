import { describe, expect, test } from "bun:test";
import { createHmac } from "crypto";
import {
  FortaAlert,
  fortaToSignal,
  fortaTier,
  fortaAttackClassHint,
  verifyFortaSignature,
} from "../lib/forta";
import {
  addressToNodeId,
  mapAddressesToNodeIds,
  expandToDownstreamNodes,
} from "../lib/forta-address-mapper";

const KELP_LIKE_FORTA_ALERT = {
  alertId: "BRIDGE-VERIFIER-ANOMALY-1",
  alertHash: "0xabc123",
  name: "LayerZero DVN Verifier Anomaly",
  severity: "CRITICAL" as const,
  protocol: "kelp",
  chainId: 1,
  addresses: ["0x50e2fe552727a4b8692c192b4f96d1a6b0d44394"],
  transactionHash: "0xdeadbeef",
  description: "1-of-1 DVN configuration detected on outbound message",
  metadata: { asset: "rsETH", layerzero: true },
  source: { url: "https://explorer.forta.network/alert/0xabc123" },
};

const DRIFT_LIKE_FORTA_ALERT = {
  alertId: "ACCESS-CONTROL-DURABLE-NONCE",
  name: "Solana Durable Nonce Pre-signing",
  severity: "HIGH" as const,
  protocol: "drift",
  chainId: 101,
  addresses: ["0x000000000000000000000000000000000000dead"],
  description: "Multisig durable nonce pre-signing pattern",
};

describe("Forta payload validation", () => {
  test("Kelp-like alert parses cleanly", () => {
    const parsed = FortaAlert.safeParse(KELP_LIKE_FORTA_ALERT);
    expect(parsed.success).toBe(true);
  });

  test("missing chainId fails validation", () => {
    const bad = { ...KELP_LIKE_FORTA_ALERT, chainId: undefined };
    const parsed = FortaAlert.safeParse(bad);
    expect(parsed.success).toBe(false);
  });

  test("severity enum is enforced", () => {
    const bad = { ...KELP_LIKE_FORTA_ALERT, severity: "EXTREME" };
    const parsed = FortaAlert.safeParse(bad);
    expect(parsed.success).toBe(false);
  });
});

describe("Forta -> Signal translation", () => {
  test("bridge bot maps to Layer 1 + CRITICAL", () => {
    const sig = fortaToSignal(KELP_LIKE_FORTA_ALERT);
    expect(sig.source).toBe("forta");
    expect(sig.layer).toBe(1);
    expect(sig.severity).toBe("CRITICAL");
    expect(sig.protocol).toBe("kelp");
    expect(sig.asset).toBe("rsETH");
  });

  test("HIGH Forta severity maps to ELEVATED Bunker severity", () => {
    const sig = fortaToSignal(DRIFT_LIKE_FORTA_ALERT);
    expect(sig.severity).toBe("ELEVATED");
  });

  test("non-bridge bots default to Layer 5", () => {
    const sig = fortaToSignal(DRIFT_LIKE_FORTA_ALERT);
    expect(sig.layer).toBe(5);
  });
});

describe("Forta tier + attack-class hints", () => {
  test("CRITICAL alerts escalate to T2 from a single Forta source", () => {
    expect(fortaTier(KELP_LIKE_FORTA_ALERT)).toBe("T2");
  });

  test("HIGH alerts stay T1 (need corroboration)", () => {
    expect(fortaTier(DRIFT_LIKE_FORTA_ALERT)).toBe("T1");
  });

  test("bridge keywords hint bridge_verifier class", () => {
    expect(fortaAttackClassHint(KELP_LIKE_FORTA_ALERT)).toBe("bridge_verifier");
  });

  test("durable nonce hints access_control", () => {
    expect(fortaAttackClassHint(DRIFT_LIKE_FORTA_ALERT)).toBe("access_control");
  });
});

describe("Address -> graph node mapping", () => {
  test("USDC contract maps to usdc node", () => {
    expect(addressToNodeId("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")).toBe("usdc");
  });

  test("rsETH contract maps to rseth node", () => {
    expect(addressToNodeId("0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7")).toBe("rseth");
  });

  test("Aave aWETH receipt maps to aave-v3 protocol node", () => {
    expect(addressToNodeId("0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8")).toBe("aave-v3");
  });

  test("address matching is case-insensitive", () => {
    expect(addressToNodeId("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")).toBe("usdc");
  });

  test("unknown address returns null", () => {
    expect(addressToNodeId("0x0000000000000000000000000000000000000000")).toBeNull();
  });

  test("mapAddressesToNodeIds dedups and filters unknowns", () => {
    const ids = mapAddressesToNodeIds([
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // usdc
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // usdc again, lowercase
      "0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7", // rseth
      "0x0000000000000000000000000000000000000000", // unknown
    ]);
    expect(ids.sort()).toEqual(["rseth", "usdc"]);
  });
});

describe("Downstream contagion expansion", () => {
  test("rsETH exploit cascades to aave-v3, layerzero, eigenlayer", () => {
    const exposure = expandToDownstreamNodes(["rseth"], 4, 0.05);
    const ids = exposure.map((e) => e.nodeId);
    expect(ids).toContain("rseth");
    expect(ids).toContain("aave-v3");
    expect(ids).toContain("layerzero");
    expect(ids).toContain("eigenlayer");
  });

  test("root node returned with hops=0 weight=1", () => {
    const exposure = expandToDownstreamNodes(["rseth"]);
    const root = exposure.find((e) => e.nodeId === "rseth");
    expect(root?.hops).toBe(0);
    expect(root?.weight).toBe(1);
  });

  test("rootCause is preserved on cascade nodes", () => {
    const exposure = expandToDownstreamNodes(["rseth"]);
    const aave = exposure.find((e) => e.nodeId === "aave-v3");
    expect(aave?.rootCause).toBe("rseth");
  });

  test("multiple roots union their cascades", () => {
    const exposure = expandToDownstreamNodes(["rseth", "steth"]);
    const ids = exposure.map((e) => e.nodeId);
    expect(ids).toContain("rseth");
    expect(ids).toContain("steth");
  });

  test("minWeight prunes weak paths", () => {
    const heavy = expandToDownstreamNodes(["rseth"], 4, 0.5);
    const light = expandToDownstreamNodes(["rseth"], 4, 0.01);
    expect(light.length).toBeGreaterThan(heavy.length);
  });
});

describe("HMAC signature verification", () => {
  const SECRET = "test-secret";

  test("valid signature passes", () => {
    const body = JSON.stringify(KELP_LIKE_FORTA_ALERT);
    const sig = createHmac("sha256", SECRET).update(body).digest("hex");
    expect(verifyFortaSignature(body, sig, SECRET)).toBe(true);
  });

  test("sha256= prefix is stripped", () => {
    const body = JSON.stringify(KELP_LIKE_FORTA_ALERT);
    const sig = "sha256=" + createHmac("sha256", SECRET).update(body).digest("hex");
    expect(verifyFortaSignature(body, sig, SECRET)).toBe(true);
  });

  test("tampered body rejects", () => {
    const body = JSON.stringify(KELP_LIKE_FORTA_ALERT);
    const sig = createHmac("sha256", SECRET).update(body).digest("hex");
    expect(verifyFortaSignature(body + "x", sig, SECRET)).toBe(false);
  });

  test("missing signature rejects", () => {
    const body = JSON.stringify(KELP_LIKE_FORTA_ALERT);
    expect(verifyFortaSignature(body, null, SECRET)).toBe(false);
  });

  test("wrong secret rejects", () => {
    const body = JSON.stringify(KELP_LIKE_FORTA_ALERT);
    const sig = createHmac("sha256", "other-secret").update(body).digest("hex");
    expect(verifyFortaSignature(body, sig, SECRET)).toBe(false);
  });
});
