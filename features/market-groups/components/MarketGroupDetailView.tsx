"use client";

import { useMemo, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { useMarketGroupDetail } from "@/features/market-groups/hooks/useMarketGroupDetail";
import { useGroupMarkets } from "@/features/market-groups/hooks/useGroupMarkets";
import { getVenueId } from "@/config/venue.config";
import { MarketGroupDetailHeader } from "@/features/market-groups/components/MarketGroupDetailHeader";
import { GroupOutcomesList } from "@/features/market-groups/components/GroupOutcomesList";
import { MatchMarketsDebugPanel } from "@/features/market-groups/components/MatchMarketsDebugPanel";
import { MarketGroupDetailSkeleton } from "@/features/market-groups/components/MarketGroupDetailSkeleton";
import { OrderbookPanel } from "@/features/orderbook/components/OrderbookPanel";
import { UnifiedTradingPanel } from "@/features/trading/components/UnifiedTradingPanel";
import { UserOrdersPanel } from "@/features/trading/components/UserOrdersPanel";
import { MatchOrdersButton } from "@/features/trading/components/MatchOrdersButton";
import { ResolutionPanel } from "@/features/resolution/components/ResolutionPanel";
import { ResolvedOutcomeCard } from "@/features/resolution/components/ResolvedOutcomeCard";
import { RedeemPanel } from "@/features/resolution/components/RedeemPanel";
import { MarketDescription } from "@/features/market-detail/components/MarketDescription";
import { MarketDetailTabs } from "@/features/market-detail/components/MarketDetailTabs";
import { PriceChartPanel } from "@/features/price-chart";
import {
  formatSubMarketLabel,
  getOutcomeTeamLogo,
} from "@/lib/markets/marketDisplay";
import { useBrand } from "@/features/brand";
import { useFixtureTeams } from "@/features/football/hooks/useFixtureTeams";
import { useLeagueTeamLogos } from "@/features/football/hooks/useLeagueTeamLogos";
import { MatchContextSidebar } from "@/features/football/components/MatchContextSidebar";
import { MatchFaqSection } from "@/features/football/components/MatchFaqSection";
import { MatchSocialPanel } from "@/features/football/components/MatchSocialPanel";
import { LiveMatchTradingNotice } from "@/features/football/components/LiveMatchTradingNotice";
import { isOutrightGroup } from "@/lib/markets/marketFilters";
import { useIsMdUp } from "@/lib/hooks/useIsMdUp";

interface MarketGroupDetailViewProps {
  groupId: string;
}

export function MarketGroupDetailView({ groupId }: MarketGroupDetailViewProps) {
  const isMdUp = useIsMdUp();
  const searchParams = useSearchParams();
  const showDebug =
    process.env.NODE_ENV === "development" &&
    searchParams.get("debug") === "1";
  const {
    data: group,
    isLoading: groupLoading,
    error,
  } = useMarketGroupDetail(groupId);
  const { data: markets, isLoading: marketsLoading } = useGroupMarkets(groupId);
  const { locale } = useBrand();
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<0 | 1>(0);
  const fixtureTeams = useFixtureTeams(group);
  const isOutright = isOutrightGroup(group?.tags);
  const { resolveLogo: resolveOutrightLogo } = useLeagueTeamLogos(
    isOutright ? group?.tags : undefined,
  );
  const fixtureMarkets = markets ?? [];
  const displayMarkets = useMemo(
    () => fixtureMarkets.filter((market) => !market.isPlaceholder),
    [fixtureMarkets],
  );

  const handleSelectMarket = (marketId: string, outcomeIndex: 0 | 1 = 0) => {
    setSelectedMarketId(marketId);
    setSelectedOutcomeIndex(outcomeIndex);
  };

  useEffect(() => {
    if (displayMarkets.length > 0 && !selectedMarketId) {
      const firstActive = displayMarkets.find(
        (m) => !m.isPlaceholder && m.status === "Active",
      );

      if (firstActive) {
        setSelectedMarketId(firstActive.marketId);
      } else {
        setSelectedMarketId(displayMarkets[0].marketId);
      }
    }
  }, [displayMarkets, selectedMarketId]);

  if (groupLoading || marketsLoading) {
    return <MarketGroupDetailSkeleton />;
  }

  const configuredVenueId = getVenueId();
  const foreignGroup =
    !!group &&
    configuredVenueId !== undefined &&
    group.venueId != null &&
    BigInt(group.venueId) !== configuredVenueId;

  if (error || !group || foreignGroup) {
    return (
      <section className="flex flex-col gap-6 pt-4 pb-8 md:pt-6 md:pb-10">
        <div className="text-center py-12">
          <p className="text-default-500">
            {error ? "Failed to load market group" : "Market group not found"}
          </p>
        </div>
      </section>
    );
  }

  const selectedMarket = displayMarkets.find(
    (m) => m.marketId === selectedMarketId,
  );
  const selectedMarketLabel =
    selectedMarket ?
      formatSubMarketLabel(selectedMarket.name, locale, fixtureTeams)
    : undefined;
  const selectedTeamLogo =
    selectedMarket ?
      getOutcomeTeamLogo(
        selectedMarket.marketType,
        selectedMarket.outcomeKey,
        fixtureTeams,
      ) ??
      (isOutright && selectedMarket.name
        ? resolveOutrightLogo(selectedMarket.name)
        : null)
    : null;

  const isResolved = selectedMarket?.status === "Resolved";
  const canTrade = group.status !== "Draft" && !!selectedMarket;

  const renderTradePanel = (): ReactNode => {
    if (!canTrade || !selectedMarket) return null;

    if (isResolved) {
      return (
        <ResolvedOutcomeCard
          outcomes={selectedMarket.outcomes}
          resolvedOutcome={selectedMarket.resolvedOutcome}
        />
      );
    }

    return (
      <>
        {!isOutright && <LiveMatchTradingNotice groupTags={group.tags} />}
        <UnifiedTradingPanel
          key={selectedMarket.marketId}
          initialOutcomeIndex={selectedOutcomeIndex}
          marketId={selectedMarket.marketId}
          marketLabel={selectedMarketLabel ?? selectedMarket.name}
          metadataURI={selectedMarket.metadataURI}
          noPrice={selectedMarket.noPrice}
          outcomes={selectedMarket.outcomes}
          teamLogoUrl={selectedTeamLogo}
          tickSize={selectedMarket.tickSize}
          yesPrice={selectedMarket.yesPrice}
        />
      </>
    );
  };

  const renderSettlementPanel = (): ReactNode => {
    if (!canTrade || !selectedMarket) return null;

    return isResolved ?
        <RedeemPanel
          standalone
          marketId={selectedMarket.marketId}
          outcomes={selectedMarket.outcomes}
        />
      : <ResolutionPanel
          marketId={selectedMarket.marketId}
          outcomes={selectedMarket.outcomes}
        />;
  };

  const renderContextPanel = (): ReactNode =>
    !isOutright && canTrade ?
      <MatchContextSidebar groupTags={group.tags} />
    : null;

  return (
    <section className="flex flex-col gap-4 pt-3 pb-8 sm:gap-6 md:pt-6 md:pb-10">
      <MarketGroupDetailHeader
        group={group}
        selectedMarketId={selectedMarketId}
        teams={fixtureTeams}
      />

      {showDebug && (
        <MatchMarketsDebugPanel
          groupTags={group.tags}
          markets={fixtureMarkets}
        />
      )}

      {/*
        Polymarket-style mobile: outcomes → buy/sell → chart/book → secondary.
        Desktop: left market stack | sticky trade + context rail.
      */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_338px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <GroupOutcomesList
            isOutrightGroup={isOutright}
            markets={displayMarkets}
            resolveOutcomeLogo={isOutright ? resolveOutrightLogo : undefined}
            selectedMarketId={selectedMarketId}
            teams={fixtureTeams}
            onSelectMarket={handleSelectMarket}
          />

          {/* Mobile: trade immediately under outcomes */}
          {canTrade && !isMdUp && (
            <div className="flex flex-col gap-4">{renderTradePanel()}</div>
          )}

          {canTrade && selectedMarket && (
            <>
              <PriceChartPanel
                lastPriceTick={selectedMarket.lastPriceTick_0}
                marketId={selectedMarket.marketId}
                outcomes={selectedMarket.outcomes}
                tickSize={selectedMarket.tickSize}
              />
              <OrderbookPanel
                marketId={selectedMarket.marketId}
                outcomes={selectedMarket.outcomes}
                tickSize={selectedMarket.tickSize}
              />
              <MatchOrdersButton
                marketId={selectedMarket.marketId}
                tickSize={selectedMarket.tickSize}
              />
              <UserOrdersPanel
                isResolved={isResolved}
                marketId={selectedMarket.marketId}
                outcomes={selectedMarket.outcomes}
                tickSize={selectedMarket.tickSize}
              />
              <MarketDetailTabs
                groupTags={!isOutright ? group.tags : undefined}
                marketId={selectedMarket.marketId}
                noPrice={selectedMarket.noPrice}
                outcomes={selectedMarket.outcomes}
                tickSize={selectedMarket.tickSize}
                yesPrice={selectedMarket.yesPrice}
              />

              {/* Mobile: match intel + settlement after trading tools */}
              {!isMdUp && (
                <div className="flex flex-col gap-4">
                  {renderContextPanel()}
                  {renderSettlementPanel()}
                </div>
              )}

              <MarketDescription description={selectedMarket.description} />
              {!isOutright && fixtureTeams && (
                <MatchSocialPanel
                  awayTeamName={fixtureTeams.away.name}
                  groupTags={group.tags}
                  homeTeamName={fixtureTeams.home.name}
                />
              )}
              {!isOutright && <MatchFaqSection groupTags={group.tags} />}
            </>
          )}
        </div>

        {/* Desktop sticky rail */}
        {isMdUp && (
          <div className="flex flex-col gap-4 sticky top-4 min-w-0">
            {renderTradePanel()}
            {renderSettlementPanel()}
            {renderContextPanel()}
          </div>
        )}
      </div>
    </section>
  );
}
