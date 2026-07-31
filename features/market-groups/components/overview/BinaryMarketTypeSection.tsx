"use client";

import type { GroupMarketDetail } from "../../hooks/useGroupMarkets";
import type { MarketTypeId } from "@/config/marketTypes";
import { getOutcomeLabel } from "@/config/marketTypes";
import type { Locale } from "@/config/locales";

/** Market types rendered as a single Yes/No (or Over/Under) pair on detail pages. */
export const BINARY_PAIR_MARKET_TYPES: MarketTypeId[] = [
  "btts",
  "ou15",
  "ou25",
  "ou35",
];

export function isBinaryPairMarketType(
  marketType: MarketTypeId | "other",
): marketType is MarketTypeId {
  return (
    marketType !== "other" &&
    BINARY_PAIR_MARKET_TYPES.includes(marketType as MarketTypeId)
  );
}

interface BinaryMarketTypeSectionProps {
  marketType: MarketTypeId;
  markets: GroupMarketDetail[];
  selectedMarketId: string | null;
  locale: Locale;
  onSelectMarket: (marketId: string, outcomeIndex?: 0 | 1) => void;
}

/** Dedicated Yes/No (or Over/Under) layout for BTTS and O/U tabs. */
export function BinaryMarketTypeSection({
  marketType,
  markets,
  selectedMarketId,
  locale,
  onSelectMarket,
}: BinaryMarketTypeSectionProps) {
  const positiveKey = marketType === "btts" ? "yes" : "over";
  const negativeKey = marketType === "btts" ? "no" : "under";

  const positiveMarket = markets.find((m) => m.outcomeKey === positiveKey);
  const negativeMarket = markets.find((m) => m.outcomeKey === negativeKey);

  if (!positiveMarket || !negativeMarket) {
    return null;
  }

  const positiveLabel = getOutcomeLabel(marketType, positiveKey, locale);
  const negativeLabel = getOutcomeLabel(marketType, negativeKey, locale);
  const positivePct = Math.round(positiveMarket.yesPrice);
  const negativePct = Math.round(negativeMarket.yesPrice);
  const selectedPositive = selectedMarketId === positiveMarket.marketId;
  const selectedNegative = selectedMarketId === negativeMarket.marketId;

  return (
    <div className="px-4 py-4">
      <div className="flex gap-2">
        <button
          className={`flex-1 rounded-xl border-2 py-4 text-center transition-all ${
            selectedPositive ?
              "border-primary bg-primary/15 shadow-[0_0_16px_rgba(34,211,238,0.2)]"
            : "border-transparent bg-primary/10 hover:bg-primary/15"
          }`}
          type="button"
          onClick={() => onSelectMarket(positiveMarket.marketId, 0)}
        >
          <span className="block text-sm font-semibold text-primary">
            {positiveLabel}
          </span>
          <span className="mt-1 block text-xl font-bold text-primary tabular-nums">
            {positivePct}%
          </span>
          <span className="mt-0.5 block text-xs text-primary/70">
            {positivePct}c
          </span>
        </button>
        <button
          className={`flex-1 rounded-xl border-2 py-4 text-center transition-all ${
            selectedNegative ?
              "border-secondary bg-secondary/15 shadow-[0_0_16px_rgba(217,70,239,0.2)]"
            : "border-transparent bg-secondary/10 hover:bg-secondary/15"
          }`}
          type="button"
          onClick={() => onSelectMarket(negativeMarket.marketId, 0)}
        >
          <span className="block text-sm font-semibold text-secondary">
            {negativeLabel}
          </span>
          <span className="mt-1 block text-xl font-bold text-secondary tabular-nums">
            {negativePct}%
          </span>
          <span className="mt-0.5 block text-xs text-secondary/70">
            {negativePct}c
          </span>
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-default-400">
        {positiveMarket.volumeFormatted} Vol.
      </p>
    </div>
  );
}
