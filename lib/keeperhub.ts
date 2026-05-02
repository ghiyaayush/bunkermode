/**
 * KeeperHub workflow execution layer.
 *
 * Three execution paths in priority order:
 *   1. KeeperHub managed workflow (preferred). Retry, gas opt, private routing.
 *   2. Direct viem call to Aave V3 withdraw (fallback when KeeperHub is down).
 *   3. Mock receipt (when neither is available, e.g., local dev without RPC).
 *
 * The mock path is the demo default. The viem fallback path is wired but
 * needs ANVIL_RPC_URL + DEMO_WALLET_PRIVATE_KEY to actually broadcast.
 */

import { createWalletClient, createPublicClient, http, parseAbi, encodeFunctionData } from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export interface WorkflowFireRequest {
  walletAddress: string;
  policyId: string;
  exitRoute: string;
  attackClass: string;
  reason: string;
  /** Aave V3 reserve address being withdrawn from (optional) */
  asset?: `0x${string}`;
  amountWei?: bigint;
}

export interface WorkflowFireResponse {
  ok: boolean;
  executionId: string;
  txHashes: string[];
  fees: { gasUsd: number; x402Usd: number };
  via: "keeperhub" | "viem-fallback" | "mock";
  log: string[];
}

const AAVE_V3_POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2" as const;
const aavePoolAbi = parseAbi([
  "function withdraw(address asset, uint256 amount, address to) external returns (uint256)",
]);

export async function fireWorkflow(req: WorkflowFireRequest): Promise<WorkflowFireResponse> {
  // Path 1: KeeperHub managed workflow
  const apiKey = process.env.KEEPERHUB_API_KEY;
  const apiUrl = process.env.KEEPERHUB_API_URL ?? "https://api.keeperhub.com";
  if (apiKey) {
    try {
      const res = await fetch(`${apiUrl}/v1/workflows/fire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(req),
      });
      if (res.ok) {
        const data = (await res.json()) as Omit<WorkflowFireResponse, "via" | "log">;
        return { ...data, via: "keeperhub", log: ["[keeperhub] managed workflow executed"] };
      }
      console.warn("KeeperHub returned non-ok status:", res.status);
    } catch (err) {
      console.warn("KeeperHub call failed:", err);
    }
  }

  // Path 2: viem direct call to Aave V3 withdraw
  const rpcUrl = process.env.ANVIL_RPC_URL ?? process.env.MAINNET_RPC_URL;
  const pk = process.env.DEMO_WALLET_PRIVATE_KEY;
  if (rpcUrl && pk && req.asset && req.amountWei) {
    try {
      const account = privateKeyToAccount(pk as `0x${string}`);
      const publicClient = createPublicClient({ chain: mainnet, transport: http(rpcUrl) });
      const walletClient = createWalletClient({
        account,
        chain: mainnet,
        transport: http(rpcUrl),
      });

      const calldata = encodeFunctionData({
        abi: aavePoolAbi,
        functionName: "withdraw",
        args: [req.asset, req.amountWei, account.address],
      });

      const gas = await publicClient.estimateGas({
        account: account.address,
        to: AAVE_V3_POOL,
        data: calldata,
      });

      const hash = await walletClient.sendTransaction({
        to: AAVE_V3_POOL,
        data: calldata,
        gas,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        ok: receipt.status === "success",
        executionId: `viem_${hash.slice(2, 10)}`,
        txHashes: [hash],
        fees: { gasUsd: Number(receipt.gasUsed) * 0.00000003 * 3000, x402Usd: 0 },
        via: "viem-fallback",
        log: [
          `[viem] Aave V3 withdraw submitted: ${hash}`,
          `[viem] gas used: ${receipt.gasUsed}`,
          `[viem] reason: ${req.reason}`,
        ],
      };
    } catch (err) {
      console.warn("viem fallback failed, returning mock:", err);
    }
  }

  // Path 3: Mock receipt (demo default)
  return mockFire(req);
}

function mockFire(req: WorkflowFireRequest): WorkflowFireResponse {
  const executionId = `exec_${Math.random().toString(36).slice(2, 10)}`;
  return {
    ok: true,
    executionId,
    txHashes: [
      `0x${Math.random().toString(16).slice(2, 66).padEnd(64, "0")}`,
      `0x${Math.random().toString(16).slice(2, 66).padEnd(64, "0")}`,
    ],
    fees: { gasUsd: 12.34, x402Usd: 2.5 },
    via: "mock",
    log: [
      `[mock] withdraw initiated for ${req.walletAddress}`,
      `[mock] swap collateral to USDC`,
      `[mock] bridge to ${req.exitRoute}`,
      `[mock] reason: ${req.reason}`,
    ],
  };
}

/**
 * x402 payment hook. Charges the user's wallet for the execution.
 * Mocked for hackathon. Production version uses Coinbase CDP x402.
 */
export async function chargeViaX402(walletAddress: string, amountUsd: number): Promise<{
  ok: boolean;
  txHash: string;
  protocol: "x402" | "mpp" | "stub";
}> {
  if (!process.env.CDP_API_KEY) {
    return {
      ok: true,
      txHash: `stub_${Math.random().toString(36).slice(2, 12)}`,
      protocol: "stub",
    };
  }
  // TODO(production): wire to Coinbase CDP
  return {
    ok: true,
    txHash: `0x${Math.random().toString(16).slice(2, 66).padEnd(64, "0")}`,
    protocol: "x402",
  };
}
