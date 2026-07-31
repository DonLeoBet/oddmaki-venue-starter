import type { FormattedGroupOutcome } from "@/features/market-groups/types";
import type { MarketTypeId } from "@/config/marketTypes";
import {
  MARKET_TYPES,
  getMarketTabLabel,
  sortMarketTypes,
} from "@/config/marketTypes";
import type { Locale } from "@/config/locales";
import {
  formatOverviewOutcomeLabel,
  parseSubMarketIdentity,
  type FixtureTeams,
} from "@/lib/markets/marketDisplay";
import { isCanonicalSubMarketName } from "@/lib/markets/marketFilters";

export interface OverviewOutcomeChip {
  marketId: string;
  marketType: MarketTypeId;
  outcomeKey: string;
  label: string;
  probability: number;
}

export interface OverviewMarketTypeRow {
  marketType: MarketTypeId;
  label: string;
  outcomes: OverviewOutcomeChip[];
}

function sortOutcomesWithinType(
  marketType: MarketTypeId,
  outcomes: OverviewOutcomeChip[],
): OverviewOutcomeChip[] {
  const order = MARKET_TYPES[marketType].outcomeKeys;

  return [...outcomes].sort(
    (a, b) => order.indexOf(a.outcomeKey) - order.indexOf(b.outcomeKey),
  );
}

/** Group canonical sub-markets into one overview row per marketType. */
export function groupOutcomesForOverview(
  outcomes: FormattedGroupOutcome[],
  locale: Locale,
  teams?: FixtureTeams,
  visibleMarketTypes?: MarketTypeId[],
): OverviewMarketTypeRow[] {
  const allowed =
    visibleMarketTypes?.length ?
      new Set<MarketTypeId>(visibleMarketTypes)
    : null;

  const buckets = new Map<MarketTypeId, OverviewOutcomeChip[]>();

  for (const outcome of outcomes) {
    if (outcome.isPlaceholder || !isCanonicalSubMarketName(outcome.name)) {
      continue;
    }

    const identity = parseSubMarketIdentity(outcome.name);

    if (!identity) continue;
    if (allowed && !allowed.has(identity.marketType)) continue;

    const chip: OverviewOutcomeChip = {
      marketId: outcome.marketId,
      marketType: identity.marketType,
      outcomeKey: identity.outcomeKey,
      label: formatOverviewOutcomeLabel(
        identity.marketType,
        identity.outcomeKey,
        locale,
        teams,
      ),
      probability: outcome.probability,
    };

    const list = buckets.get(identity.marketType) ?? [];

    list.push(chip);
    buckets.set(identity.marketType, list);
  }

  return sortMarketTypes(Array.from(buckets.keys())).map((marketType) => ({
    marketType,
    label: getMarketTabLabel(marketType, locale),
    outcomes: sortOutcomesWithinType(marketType, buckets.get(marketType) ?? []),
  }));
}

/** Minimal outcome shape for category league pages (single marketType filter). */
export interface CategoryOutcomeLike {
  marketId: string;
  name: string;
  yesPrice: number;
}

export function toOverviewOutcomeChips(
  markets: CategoryOutcomeLike[],
  marketType: MarketTypeId,
  locale: Locale,
  teams?: FixtureTeams,
): OverviewOutcomeChip[] {
  const chips: OverviewOutcomeChip[] = [];

  for (const market of markets) {
    const identity = parseSubMarketIdentity(market.name);

    if (!identity || identity.marketType !== marketType) continue;

    chips.push({
      marketId: market.marketId,
      marketType: identity.marketType,
      outcomeKey: identity.outcomeKey,
      label: formatOverviewOutcomeLabel(
        identity.marketType,
        identity.outcomeKey,
        locale,
        teams,
      ),
      probability: market.yesPrice,
    });
  }

  return sortOutcomesWithinType(marketType, chips);
}
