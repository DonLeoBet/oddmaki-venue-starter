export type { PythFeedConfig as PythFeed } from "@/config/pyth-feeds";
export {
  BASE_PYTH_FEED,
  PYTH_FEED_MAP,
  TOP_PYTH_FEEDS as PYTH_FEEDS,
  resolvePythFeedById,
  resolvePythAssetLabel,
} from "@/config/pyth-feeds";

/**
 * Trading-window presets, measured from the market's effective open time:
 * - For immediate markets, "5m" means "closes 5 minutes after tx mines".
 * - For scheduled markets, "5m" means "closes 5 minutes after openTime".
 */
export const PYTH_DURATION_PRESETS: { label: string; seconds: number }[] = [
  { label: "1m", seconds: 60 },
  { label: "2m", seconds: 120 },
  { label: "5m", seconds: 300 },
  { label: "15m", seconds: 900 },
  { label: "30m", seconds: 1800 },
  { label: "1h", seconds: 3600 },
  { label: "4h", seconds: 14400 },
  { label: "24h", seconds: 86400 },
];

export const PYTH_FEED_ID_REGEX = /^0x[0-9a-fA-F]{64}$/;
export const PYTH_HERMES_BASE = "https://hermes.pyth.network";

export interface PythLatest {
  price: number;
  expo: number;
}

export async function fetchPythLatest(
  feedId: string,
  signal?: AbortSignal,
): Promise<PythLatest | null> {
  try {
    const res = await fetch(
      `${PYTH_HERMES_BASE}/v2/updates/price/latest?ids[]=${feedId}`,
      { signal },
    );

    if (!res.ok) return null;
    const data: { parsed?: { price?: { price?: string; expo?: number } }[] } =
      await res.json();
    const parsed = data.parsed?.[0]?.price;

    if (!parsed?.price) return null;
    const expo = parsed.expo ?? -8;

    return { price: Number(parsed.price) * Math.pow(10, expo), expo };
  } catch {
    return null;
  }
}
