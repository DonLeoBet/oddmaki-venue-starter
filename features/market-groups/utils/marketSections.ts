import type { GroupMarketDetail } from "../hooks/useGroupMarkets";

import type { MarketTypeId } from "@/config/marketTypes";
import { sortMarketTypes, MARKET_TYPES } from "@/config/marketTypes";
import type { BrandId } from "@/config/brandRouting";
import { isMarketTypeVisibleForBrand } from "@/config/brandMarkets";
import type { Locale } from "@/config/locales";
import {
  formatMarketTypeTabLabel,
  inferMarketTypeFromSubMarketName,
} from "@/lib/markets/marketDisplay";

export interface MatchMarketSection {
  id: MarketTypeId | "other";
  label: string;
  markets: GroupMarketDetail[];
}

export interface GroupMarketsBySectionOptions {
  locale?: Locale;
  brandId?: BrandId;
  /** Match detail shows every on-chain sub-market, not brand nav subset. */
  forMatchDetail?: boolean;
}

export function categorizeGroupMarket(
  market: Pick<GroupMarketDetail, "name" | "marketType">,
): MarketTypeId | "other" {
  if (market.marketType) return market.marketType;

  return inferMarketTypeFromSubMarketName(market.name) ?? "other";
}

function sortMarketsWithinSection(
  sectionId: MarketTypeId | "other",
  markets: GroupMarketDetail[],
): GroupMarketDetail[] {
  if (sectionId === "other") {
    return [...markets].sort((a, b) => a.name.localeCompare(b.name));
  }

  const order = MARKET_TYPES[sectionId].outcomeKeys;

  return [...markets].sort((a, b) => {
    const ai = a.outcomeKey ? order.indexOf(a.outcomeKey) : -1;
    const bi = b.outcomeKey ? order.indexOf(b.outcomeKey) : -1;

    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

/** Group child markets into football bet-type sections for the detail page. */
export function groupMarketsBySection(
  markets: GroupMarketDetail[],
  options: GroupMarketsBySectionOptions = {},
): MatchMarketSection[] {
  const locale = options.locale ?? "en";
  const brandId = options.brandId ?? "polyfootball";
  const forMatchDetail = options.forMatchDetail ?? false;
  const activeMarkets = markets.filter((market) => !market.isPlaceholder);
  const buckets = new Map<MarketTypeId | "other", GroupMarketDetail[]>();

  for (const market of activeMarkets) {
    let section = categorizeGroupMarket(market);

    if (
      !forMatchDetail &&
      section !== "other" &&
      !isMarketTypeVisibleForBrand(brandId, section)
    ) {
      continue;
    }

    if (
      section === "other" &&
      !market.name.includes(" · ") &&
      !market.name.includes(":")
    ) {
      section = "1x2";
    }

    const list = buckets.get(section) ?? [];

    list.push(market);
    buckets.set(section, list);
  }

  const typeIds = sortMarketTypes(
    Array.from(buckets.keys()).filter(
      (k): k is MarketTypeId => k !== "other",
    ),
  );

  const sections: MatchMarketSection[] = typeIds.map((id) => ({
    id,
    label: formatMarketTypeTabLabel(id, locale),
    markets: sortMarketsWithinSection(id, buckets.get(id) ?? []),
  }));

  const other = buckets.get("other");

  if (other?.length) {
    sections.push({
      id: "other",
      label: "Markets",
      markets: sortMarketsWithinSection("other", other),
    });
  }

  return sections.filter((s) => s.markets.length > 0);
}

export function getVisibleMarketTypeTabs(
  brandId: BrandId,
  locale: Locale = "en",
): { id: MarketTypeId; label: string }[] {
  return sortMarketTypes(
    (Object.keys(MARKET_TYPES) as MarketTypeId[]).filter((id) =>
      isMarketTypeVisibleForBrand(brandId, id),
    ),
  ).map((id) => ({
    id,
    label: formatMarketTypeTabLabel(id, locale),
  }));
}

export function sectionIdForMarket(
  markets: GroupMarketDetail[],
  marketId: string | null,
): MarketTypeId | "other" | null {
  if (!marketId) return null;

  const market = markets.find((entry) => entry.marketId === marketId);

  if (!market) return null;

  return categorizeGroupMarket(market);
}
