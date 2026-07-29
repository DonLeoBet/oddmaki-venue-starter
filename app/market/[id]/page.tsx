"use client";

import type { DpmMarketSummary } from "@/features/dpm";

import { use } from "react";

import { useMarketDetail } from "@/features/market-detail/hooks/useMarketDetail";
import { useMarketVenueAccess } from "@/features/market-detail/hooks/useMarketVenueAccess";
import { MarketDetailHeader } from "@/features/market-detail/components/MarketDetailHeader";
import { MarketDetailSkeleton } from "@/features/market-detail/components/MarketDetailSkeleton";
import { MarketDescription } from "@/features/market-detail/components/MarketDescription";
import { MarketDetailTabs } from "@/features/market-detail/components/MarketDetailTabs";
import { OrderbookPanel } from "@/features/orderbook/components/OrderbookPanel";
import { UnifiedTradingPanel } from "@/features/trading/components/UnifiedTradingPanel";
import { UserOrdersPanel } from "@/features/trading/components/UserOrdersPanel";
import { MatchOrdersButton } from "@/features/trading/components/MatchOrdersButton";
import { ResolutionPanel } from "@/features/resolution/components/ResolutionPanel";
import { ResolvedOutcomeCard } from "@/features/resolution/components/ResolvedOutcomeCard";
import { RedeemPanel } from "@/features/resolution/components/RedeemPanel";
import { PriceChartPanel } from "@/features/price-chart";
import {
  usePriceMarketData,
  PriceMarketInfo,
  PriceMarketResolutionPanel,
  PriceMarketChartSection,
} from "@/features/price-market";
import {
  TimeWindowStrip,
  usePriceMarketSeries,
  extractSeriesKey,
} from "@/features/price-market-series";
import {
  useDpmMarketData,
  DpmMarketBadge,
  DpmMarketInfo,
  DpmTradingPanel,
  DpmOddsChart,
  DpmProbabilityChart,
  DpmClaimPanel,
  DpmMarketTabs,
} from "@/features/dpm";
import { formatUsdc } from "@/features/dpm/lib/format";

/** Headline stats for a Pool market: leading outcome, pool size, trader count. */
function computePoolStats(d: DpmMarketSummary, outcomes: string[]) {
  const total = Number(d.totalCollateral ?? "0");
  let bestI = 0;
  let bestPct =
    total > 0 ? 0 : Math.round(100 / Math.max(1, d.outcomes.length));

  if (total > 0) {
    for (let i = 0; i < d.outcomes.length; i++) {
      const pct = Math.round((Number(d.outcomes[i].collateral) / total) * 100);

      if (pct > bestPct) {
        bestPct = pct;
        bestI = i;
      }
    }
  }

  return {
    favoriteLabel:
      outcomes[bestI] ?? d.outcomes[bestI]?.label ?? `Outcome ${bestI}`,
    favoritePct: bestPct,
    volume: formatUsdc(d.totalCollateral ?? "0"),
    traders: String(d.uniqueTraders ?? "0"),
  };
}

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: market, isLoading, error } = useMarketDetail(id);
  // Guard against cross-venue access: the shared Diamond/subgraph will return a
  // market by id regardless of which venue owns it, so we verify on-chain that
  // it belongs to this venue before rendering anything about it.
  const {
    data: venueAccess,
    isLoading: venueAccessLoading,
    isError: venueAccessError,
  } = useMarketVenueAccess(id);
  const { data: priceMarket } = usePriceMarketData(BigInt(id));
  const { data: dpm } = useDpmMarketData(BigInt(id));
  const seriesKey = extractSeriesKey(market?.tags);
  // Center the series window on the market being viewed, so the time strip loads
  // ~20 windows around it (not the whole series) and re-pivots on navigation.
  const { data: series } = usePriceMarketSeries(
    seriesKey,
    priceMarket?.data?.closeTime,
  );

  if (isLoading || venueAccessLoading) {
    return (
      <section className="flex flex-col gap-6 pt-4 pb-8 md:pt-6 md:pb-10">
        <MarketDetailSkeleton />
      </section>
    );
  }

  // Distinguish three terminal states, in order:
  //  1. subgraph load failure → "Failed to load" (transient/retryable)
  //  2. market genuinely absent, OR belongs to another venue → "not found"
  //     (a foreign market is hidden — we don't reveal it exists elsewhere)
  //  3. market exists but its venue couldn't be verified on-chain (RPC blip) →
  //     a verification failure, NOT "not found"
  const foreignMarket = !!venueAccess && !venueAccess.belongs;
  const venueUnverified = !!market && !venueAccess && venueAccessError;

  if (error || venueUnverified || !market || foreignMarket) {
    const message = error
      ? "Failed to load market"
      : venueUnverified
        ? "Couldn't verify this market. Please try again."
        : "Market not found";

    return (
      <section className="flex flex-col gap-6 pt-4 pb-8 md:pt-6 md:pb-10">
        <div className="text-center py-12">
          <p className="text-default-500">{message}</p>
        </div>
      </section>
    );
  }

  const isPriceMarket = priceMarket?.isPriceMarket && priceMarket.data;
  const isDpmMarket = dpm?.isDpmMarket && dpm.data;
  // On-chain `resolved` is authoritative. Trust it alongside the subgraph status
  // so the UI flips to its resolved state immediately after resolution, even
  // while the subgraph is still indexing the MarketResolved event.
  const isResolved =
    market.status === "Resolved" ||
    !!priceMarket?.data?.resolved ||
    !!dpm?.data?.resolved;

  // Pool markets reuse the CTF condition, so they still need the UMA/Pyth
  // resolution step once trading closes — before anyone can claim from the pool.
  const dpmAwaitingResolution =
    !!isDpmMarket &&
    !isResolved &&
    Number(dpm!.data!.closeTime) <= Math.floor(Date.now() / 1000);

  const poolStats = isDpmMarket
    ? computePoolStats(dpm!.data!, market.outcomes)
    : undefined;
  const winningOutcome =
    market.resolvedOutcome != null
      ? market.resolvedOutcome === 0
        ? "YES"
        : "NO"
      : undefined;

  return (
    <section className="flex flex-col gap-6 pt-4 pb-8 md:pt-6 md:pb-10">
      {/* Header: title, status, prices, stats */}
      <MarketDetailHeader
        isResolved={isResolved}
        market={market}
        poolStats={poolStats}
      />

      {isDpmMarket && (
        <div className="-mt-2">
          <DpmMarketBadge size="md" />
        </div>
      )}

      {/* Two-column layout: left (~938px) | right (338px). On mobile, trading panel appears first. */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_338px] gap-4 items-start">
        {/* Left column */}
        <div className="flex flex-col gap-4 order-2 md:order-1">
          {isDpmMarket ? (
            // Pool markets: a price (Pyth) pool keeps the asset price chart +
            // header like any price market, plus the pool's implied-odds chart,
            // description, and Activity/Holders/Positions tabs. (No CLOB book.)
            <>
              {isPriceMarket ? (
                // Price pool: asset chart + header, with the pool's implied-odds
                // chart living in the section's Probability tab.
                <PriceMarketChartSection
                  lastPriceTick={market.lastPriceTick_0}
                  marketId={market.marketId}
                  outcomes={market.outcomes}
                  priceMarketData={priceMarket!.data!}
                  probabilitySlot={
                    <DpmProbabilityChart
                      marketId={market.marketId}
                      outcomes={market.outcomes}
                    />
                  }
                  projectedOpenPrice={priceMarket!.projectedOpenPrice}
                  tickSize={market.tickSize}
                />
              ) : (
                // UMA pool: implied-odds chart stands alone (no asset chart).
                <DpmOddsChart
                  marketId={market.marketId}
                  outcomes={market.outcomes}
                />
              )}
              <MarketDescription description={market.description} />
              <DpmMarketTabs
                data={dpm!.data!}
                marketId={market.marketId}
                outcomes={market.outcomes}
              />
            </>
          ) : (
            <>
              {isPriceMarket ? (
                <PriceMarketChartSection
                  lastPriceTick={market.lastPriceTick_0}
                  marketId={market.marketId}
                  outcomes={market.outcomes}
                  priceMarketData={priceMarket!.data!}
                  projectedOpenPrice={priceMarket!.projectedOpenPrice}
                  tickSize={market.tickSize}
                />
              ) : (
                <PriceChartPanel
                  lastPriceTick={market.lastPriceTick_0}
                  marketId={market.marketId}
                  outcomes={market.outcomes}
                  tickSize={market.tickSize}
                />
              )}
              {series && (
                <TimeWindowStrip
                  selectedMarketId={market.marketId}
                  series={series}
                />
              )}
              <OrderbookPanel
                marketId={market.marketId}
                outcomes={market.outcomes}
                tickSize={market.tickSize}
              />
              <MatchOrdersButton
                marketId={market.marketId}
                tickSize={market.tickSize}
              />

              <MarketDescription description={market.description} />
              <UserOrdersPanel
                isResolved={isResolved}
                marketId={market.marketId}
                outcomes={market.outcomes}
                tickSize={market.tickSize}
              />
              <MarketDetailTabs
                marketId={market.marketId}
                noPrice={market.noPrice}
                outcomes={market.outcomes}
                tickSize={market.tickSize}
                yesPrice={market.yesPrice}
              />
            </>
          )}
        </div>

        {/* Right column (sticky trading panel) */}
        <div className="flex flex-col gap-4 order-1 md:order-2">
          {isDpmMarket ? (
            dpm!.data!.resolved ? (
              // Resolved pool: winner hero + claim, mirroring the CLOB.
              <>
                {dpm!.data!.winningOutcome != null && (
                  <ResolvedOutcomeCard
                    outcomes={market.outcomes}
                    resolvedOutcome={dpm!.data!.winningOutcome}
                  />
                )}
                <DpmClaimPanel
                  data={dpm!.data!}
                  marketId={market.marketId}
                  outcomes={market.outcomes}
                />
                <DpmMarketInfo data={dpm!.data!} outcomes={market.outcomes} />
              </>
            ) : (
              <>
                <DpmTradingPanel
                  data={dpm!.data!}
                  marketId={market.marketId}
                  outcomes={market.outcomes}
                />
                <DpmMarketInfo data={dpm!.data!} outcomes={market.outcomes} />
                {/* Pool markets resolve through the same UMA/Pyth path as the
                    CLOB; show it once trading closes so the condition can be
                    resolved. */}
                {dpmAwaitingResolution &&
                  (isPriceMarket ? (
                    <PriceMarketResolutionPanel
                      canResolve={priceMarket.canResolve}
                      data={priceMarket.data!}
                      marketId={BigInt(market.marketId)}
                    />
                  ) : (
                    <ResolutionPanel
                      marketId={market.marketId}
                      outcomes={market.outcomes}
                    />
                  ))}
              </>
            )
          ) : (
            <>
              {isResolved ? (
                <ResolvedOutcomeCard
                  outcomes={market.outcomes}
                  resolvedOutcome={market.resolvedOutcome}
                />
              ) : (
                <UnifiedTradingPanel
                  marketId={market.marketId}
                  noPrice={market.noPrice}
                  outcomes={market.outcomes}
                  tickSize={market.tickSize}
                  yesPrice={market.yesPrice}
                />
              )}
              {/* Price market info (always shown for price markets) */}
              {isPriceMarket && (
                <PriceMarketInfo
                  data={priceMarket.data!}
                  outcomes={market.outcomes}
                  projectedOpenPrice={priceMarket.projectedOpenPrice}
                />
              )}

              {/* Resolution section */}
              {isResolved ? (
                <RedeemPanel
                  standalone
                  marketId={market.marketId}
                  outcomes={market.outcomes}
                  winningOutcome={winningOutcome}
                />
              ) : isPriceMarket ? (
                <PriceMarketResolutionPanel
                  canResolve={priceMarket.canResolve}
                  data={priceMarket.data!}
                  marketId={BigInt(market.marketId)}
                />
              ) : (
                <ResolutionPanel
                  marketId={market.marketId}
                  outcomes={market.outcomes}
                />
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
