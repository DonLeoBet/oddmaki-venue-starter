/**
 * Curated Pyth Price Feed IDs for whitelabel crypto prediction markets.
 *
 * Feed IDs are identical across EVM chains (Base, Ethereum, etc.).
 * Source: https://pyth.network/developers/price-feed-ids
 */

export interface PythFeedConfig {
  /** Short ticker used in titles and descriptions (e.g. BTC). */
  ticker: string;
  /** Human-readable asset name. */
  name: string;
  /** Trading pair label shown in the UI (e.g. BTC/USD). */
  symbol: string;
  /** Official Pyth price feed ID (0x-prefixed, 32 bytes). */
  id: `0x${string}`;
  /** Typical price exponent from Hermes (usually -8). */
  expo: number;
}

/** Top 5 crypto feeds for quick selection in the price-market creation wizard. */
export const TOP_PYTH_FEEDS: PythFeedConfig[] = [
  {
    ticker: "BTC",
    name: "Bitcoin",
    symbol: "BTC/USD",
    id: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    expo: -8,
  },
  {
    ticker: "ETH",
    name: "Ethereum",
    symbol: "ETH/USD",
    id: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    expo: -8,
  },
  {
    ticker: "SOL",
    name: "Solana",
    symbol: "SOL/USD",
    id: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    expo: -8,
  },
  {
    // Base L2 has no native token; AERO/USD is the leading Base-native Pyth feed.
    ticker: "BASE",
    name: "Aerodrome (Base L2)",
    symbol: "AERO/USD",
    id: "0x9db37f4d5654aad3e37e2e14ffd8d53265fb3026d1d8f91146539eebaa2ef45f",
    expo: -8,
  },
  {
    ticker: "BNB",
    name: "BNB",
    symbol: "BNB/USD",
    id: "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f",
    expo: -8,
  },
];

/** Base L2 ecosystem feed (Aerodrome / AERO-USD on Pyth). */
export const BASE_PYTH_FEED = TOP_PYTH_FEEDS.find((f) => f.ticker === "BASE")!;

export const PYTH_FEED_MAP = new Map(
  TOP_PYTH_FEEDS.map((f) => [f.id.toLowerCase(), f]),
);

export function resolvePythFeedById(
  feedId: string,
): PythFeedConfig | undefined {
  return PYTH_FEED_MAP.get(feedId.trim().toLowerCase());
}

export function resolvePythAssetLabel(
  feedSymbol: string,
  feedId?: string,
): string {
  if (feedId) {
    const known = resolvePythFeedById(feedId);

    if (known) return known.ticker;
  }

  const base = feedSymbol.split("/")[0]?.trim();

  return base || feedSymbol || "the asset";
}
