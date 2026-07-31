"use client";

import type { GroupMarketDetail } from "../hooks/useGroupMarkets";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";

import {
  groupMarketsBySection,
  sectionIdForMarket,
  type MatchMarketSection,
} from "../utils/marketSections";

import { MarketImage } from "@/features/markets/components/MarketImage";
import { useBrand } from "@/features/brand";
import { formatSubMarketLabel } from "@/lib/markets/marketDisplay";
import { getCommonYesNo } from "@/config/locales";
import type { FixtureTeams } from "@/lib/markets/marketDisplay";

interface GroupOutcomesListProps {
  markets: GroupMarketDetail[];
  selectedMarketId: string | null;
  onSelectMarket: (marketId: string, outcomeIndex?: 0 | 1) => void;
  teams?: FixtureTeams;
}

function MarketRow({
  market,
  isSelected,
  onSelect,
  onSelectOutcome,
  displayName,
  yesLabel,
  noLabel,
}: {
  market: GroupMarketDetail;
  isSelected: boolean;
  onSelect: () => void;
  onSelectOutcome: (outcomeIndex: 0 | 1) => void;
  displayName: string;
  yesLabel: string;
  noLabel: string;
}) {
  const pct = Math.round(market.yesPrice);

  return (
    <div
      className={`w-full px-4 py-3 flex items-center justify-between gap-3 transition-all ${
        isSelected
          ? "relative z-10 my-0.5 rounded-lg border-2 border-cyan-400 bg-cyan-400/15 shadow-[0_0_16px_rgba(34,211,238,0.2)]"
          : "border-b border-default-100 last:border-b-0 hover:bg-default-100"
      }`}
    >
      <button
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
        type="button"
        onClick={onSelect}
      >
        <MarketImage
          metadataURI={market.metadataURI}
          name={displayName}
          showFallback
          size="sm"
        />
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span
            className={`text-sm truncate ${
              isSelected ? "font-semibold text-cyan-300" : "font-medium"
            }`}
          >
            {displayName}
          </span>
          <span className="text-xs text-default-400">
            {market.volumeFormatted} Vol.
          </span>
        </div>
      </button>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className={`text-lg font-bold ${
            pct >= 50 ? "text-primary" : "text-default-500"
          }`}
        >
          {pct}%
        </span>
        <div className="flex gap-1">
          <button
            className="text-xs rounded bg-primary/10 text-primary px-2 py-1 font-medium hover:bg-primary/20 transition-colors"
            type="button"
            onClick={() => onSelectOutcome(0)}
          >
            {yesLabel} {pct}c
          </button>
          <button
            className="text-xs rounded bg-secondary/10 text-secondary px-2 py-1 font-medium hover:bg-secondary/20 transition-colors"
            type="button"
            onClick={() => onSelectOutcome(1)}
          >
            {noLabel} {100 - pct}c
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  selectedMarketId,
  onSelectMarket,
  locale,
  teams,
  yesLabel,
  noLabel,
}: {
  section: MatchMarketSection;
  selectedMarketId: string | null;
  onSelectMarket: (marketId: string, outcomeIndex?: 0 | 1) => void;
  locale: Parameters<typeof formatSubMarketLabel>[1];
  teams?: FixtureTeams;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="flex flex-col">
      {section.markets.map((market) => (
        <MarketRow
          key={market.marketId}
          displayName={formatSubMarketLabel(market.name, locale, teams)}
          isSelected={market.marketId === selectedMarketId}
          market={market}
          noLabel={noLabel}
          yesLabel={yesLabel}
          onSelect={() => onSelectMarket(market.marketId, 0)}
          onSelectOutcome={(outcomeIndex) =>
            onSelectMarket(market.marketId, outcomeIndex)
          }
        />
      ))}
    </div>
  );
}

export function GroupOutcomesList({
  markets,
  selectedMarketId,
  onSelectMarket,
  teams,
}: GroupOutcomesListProps) {
  const { brandId, locale } = useBrand();
  const { yes: yesLabel, no: noLabel } = getCommonYesNo(locale);
  const sections = useMemo(
    () =>
      groupMarketsBySection(markets, {
        brandId,
        locale,
        forMatchDetail: true,
      }),
    [markets, brandId, locale],
  );
  const placeholders = markets.filter((market) => market.isPlaceholder);
  const useTabs = sections.length > 1;

  const selectedSectionId =
    sectionIdForMarket(markets, selectedMarketId) ?? sections[0]?.id ?? null;

  const [activeTab, setActiveTab] = useState<string | null>(selectedSectionId);

  useEffect(() => {
    if (selectedSectionId) {
      setActiveTab(selectedSectionId);
    }
  }, [selectedSectionId]);

  const cardTitle =
    sections.length === 1 ? sections[0].label : "Match Markets";

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">
          {sections.length > 1 ? "Match Markets" : cardTitle}
        </h2>
      </CardHeader>
      <CardBody className="gap-0 p-0">
        {sections.length === 0 ? (
          <div className="px-4 py-6 text-sm text-default-400">
            No active markets in this group yet.
          </div>
        ) : useTabs ? (
          <Tabs
            aria-label="Match market categories"
            classNames={{
              tabList: "px-4 pt-2 flex-wrap",
              panel: "p-0",
            }}
            selectedKey={activeTab ?? sections[0]?.id}
            variant="underlined"
            onSelectionChange={(key) => setActiveTab(String(key))}
          >
            {sections.map((section) => (
              <Tab key={section.id} title={section.label}>
                <SectionBlock
                  locale={locale}
                  noLabel={noLabel}
                  section={section}
                  selectedMarketId={selectedMarketId}
                  teams={teams}
                  yesLabel={yesLabel}
                  onSelectMarket={onSelectMarket}
                />
              </Tab>
            ))}
          </Tabs>
        ) : (
          sections.map((section) => (
            <SectionBlock
              key={section.id}
              locale={locale}
              noLabel={noLabel}
              section={section}
              selectedMarketId={selectedMarketId}
              teams={teams}
              yesLabel={yesLabel}
              onSelectMarket={onSelectMarket}
            />
          ))
        )}

        {placeholders.length > 0 && (
          <div className="px-4 py-2 text-xs text-default-400">
            {placeholders.length} placeholder
            {placeholders.length > 1 ? "s" : ""} pending activation
          </div>
        )}
      </CardBody>
    </Card>
  );
}
