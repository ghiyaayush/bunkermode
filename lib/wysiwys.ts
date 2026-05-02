/**
 * WYSIWYS - What You See Is What You Sign.
 *
 * One of the three security frameworks flagged something that applies to
 * BunkerMode itself: the Bybit hack ($1.46B) succeeded because the Safe
 * UI showed a fabricated transaction summary. The signers had hardware
 * wallets. They signed what they saw. What they saw was a lie.
 *
 * Every T2 confirmation must therefore include:
 *   1. The exact simulation output (precise amounts in and out)
 *   2. The full destination address - never truncated
 *   3. A Tenderly simulation link the user can verify before tapping
 *   4. For positions above $50K: hardware wallet confirmation required,
 *      NOT a Telegram tap
 *
 * This is the difference between BunkerMode being a security tool and
 * BunkerMode being another attack surface.
 */

export interface SimulationOutput {
  /** wei or smallest unit */
  amountIn: string;
  amountInSymbol: string;
  amountOut: string;
  amountOutSymbol: string;
  destinationAddress: `0x${string}`;
  destinationLabel: string;
  chainId: number;
  /** Tenderly simulation URL for the user to verify */
  tenderlyUrl: string;
  estimatedGasUsd: number;
}

export interface WysiwysConfirmation {
  simulation: SimulationOutput;
  hardwareWalletRequired: boolean;
  positionUsdValue: number;
  hardwareWalletThresholdUsd: number;
  warnings: string[];
}

/**
 * Build a confirmation card for a proposed exit transaction.
 * The UI then displays this verbatim - no summarization that could lie.
 */
export function buildConfirmation(input: {
  simulation: SimulationOutput;
  positionUsdValue: number;
  hardwareWalletThresholdUsd?: number;
}): WysiwysConfirmation {
  const threshold = input.hardwareWalletThresholdUsd ?? 50_000;
  const warnings: string[] = [];

  if (input.simulation.destinationAddress.length !== 42) {
    warnings.push("Destination address has unusual length. Verify before signing.");
  }
  if (input.simulation.estimatedGasUsd > 200) {
    warnings.push(`Estimated gas $${input.simulation.estimatedGasUsd}. Confirm not under MEV/spike conditions.`);
  }
  if (input.positionUsdValue >= threshold) {
    warnings.push(
      `Position size $${input.positionUsdValue.toLocaleString()} exceeds $${threshold.toLocaleString()} threshold. Hardware wallet required.`,
    );
  }

  return {
    simulation: input.simulation,
    hardwareWalletRequired: input.positionUsdValue >= threshold,
    positionUsdValue: input.positionUsdValue,
    hardwareWalletThresholdUsd: threshold,
    warnings,
  };
}

/**
 * Format a Tenderly simulation URL for a generic Aave V3 withdraw.
 * Production version takes raw calldata + signed payload.
 */
export function tenderlyUrlForWithdraw(input: {
  walletAddress: string;
  asset: string;
  amount: string;
  chainId: number;
}): string {
  const params = new URLSearchParams({
    network: String(input.chainId),
    block: "latest",
    from: input.walletAddress,
    to: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // Aave V3 Pool
    value: "0",
    gas: "300000",
    label: `BunkerMode withdraw ${input.amount} ${input.asset}`,
  });
  return `https://dashboard.tenderly.co/simulator/new?${params.toString()}`;
}

/**
 * Render the confirmation as a Telegram-safe text block. Long destination
 * address is split into 4-character groups so the user can verify visually.
 */
export function renderConfirmationText(c: WysiwysConfirmation): string {
  const groups = c.simulation.destinationAddress
    .slice(2)
    .match(/.{1,4}/g)
    ?.join(" ") ?? c.simulation.destinationAddress;
  const amtIn = `${c.simulation.amountIn} ${c.simulation.amountInSymbol}`;
  const amtOut = `${c.simulation.amountOut} ${c.simulation.amountOutSymbol}`;
  return [
    "BunkerMode T2 Confirmation - WYSIWYS",
    "",
    `Send: ${amtIn}`,
    `Receive: ${amtOut}`,
    `To: ${c.simulation.destinationLabel}`,
    `Address: 0x ${groups}`,
    `Chain id: ${c.simulation.chainId}`,
    `Gas est: $${c.simulation.estimatedGasUsd.toFixed(2)}`,
    "",
    `Verify here: ${c.simulation.tenderlyUrl}`,
    "",
    c.hardwareWalletRequired
      ? "HARDWARE WALLET REQUIRED. Verify on the device screen directly."
      : "Tap to confirm. (For positions above $50K, you must sign on hardware.)",
    ...(c.warnings.length > 0 ? ["", "Warnings:", ...c.warnings.map((w) => `  - ${w}`)] : []),
  ].join("\n");
}
