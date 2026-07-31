export type { PythFeedConfig as PythFeed } from "@/config/pyth-feeds";
export {
  BASE_PYTH_FEED,
  PYTH_FEED_MAP,
  TOP_PYTH_FEEDS as PYTH_FEEDS,
  resolvePythFeedById,
} from "@/config/pyth-feeds";

/** Duration presets in seconds */
export const DURATION_PRESETS = [
  { label: "5m", value: 300 },
  { label: "15m", value: 900 },
  { label: "30m", value: 1800 },
  { label: "1h", value: 3600 },
  { label: "4h", value: 14400 },
  { label: "24h", value: 86400 },
] as const;
