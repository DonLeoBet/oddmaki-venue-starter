import { resolvePythAssetLabel } from "@/config/pyth-feeds";

export interface PriceMarketCopyInput {
  feedSymbol: string;
  feedId?: string;
  expiryTimeUtc: string;
  useStrikePrice: boolean;
  strikePrice?: number;
}

function formatStrike(strike: number): string {
  return `$${strike.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/** Auto-generated market title for Pyth price markets. */
export function formatPriceMarketTitle(input: PriceMarketCopyInput): string {
  const asset = resolvePythAssetLabel(input.feedSymbol, input.feedId);

  if (
    input.useStrikePrice &&
    input.strikePrice !== undefined &&
    input.strikePrice > 0
  ) {
    return `${asset} Above/Below ${formatStrike(input.strikePrice)} · ${input.expiryTimeUtc}`;
  }

  return `${asset} Up/Down · ${input.expiryTimeUtc}`;
}

/**
 * Anonymous, whitelabel-safe description for Pyth price markets.
 * No venue or oracle vendor branding beyond "Pyth Network".
 */
export function formatPriceMarketDescription(
  input: PriceMarketCopyInput,
): string {
  const asset = resolvePythAssetLabel(input.feedSymbol, input.feedId);

  if (
    input.useStrikePrice &&
    input.strikePrice !== undefined &&
    input.strikePrice > 0
  ) {
    return (
      `Will the price of ${asset} be higher than ${formatStrike(input.strikePrice)} at ${input.expiryTimeUtc}? ` +
      `Market resolves 100% automatically via decentralized Pyth Network data.`
    );
  }

  return (
    `Will the price of ${asset} be higher at ${input.expiryTimeUtc} than at market open? ` +
    `Market resolves 100% automatically via decentralized Pyth Network data.`
  );
}
