"use client";

import type { GroupMarketDetail } from "../hooks/useGroupMarkets";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";

import {
  groupMarketsBySection,
  sectionIdForMarket,
  type MatchMarketSection,
} from "../utils/marketSections";

import { useBrand } from "@/features/brand";
import {
  formatSubMarketLabel,
  getOutcomeTeamLogo,
} from "@/lib/markets/marketDisplay";
import { getCommonYesNo } from "@/config/locales";
import type { FixtureTeams } from "@/lib/markets/marketDisplay";
import type { MarketTypeId } from "@/config/marketTypes";
import { TeamLogo } from "@/components/football/TeamLogo";
import { DrawOutcomeIcon } from "@/components/football/DrawOutcomeIcon";
import {
  BinaryMarketTypeSection,
  isBinaryPairMarketType,
} from "./overview/BinaryMarketTypeSection";
import { OneXTwoMarketSection } from "./overview/OneXTwoMarketSection";

const PRIMARY_TAB_TYPES = new Set<MarketTypeId>(["1x2", "btts", "ou25"]);

interface GroupOutcomesListProps {
  markets: GroupMarketDetail[];
  selectedMarketId: string | null;
  onSelectMarket: (marketId: string, outcomeIndex?: 0 | 1) => void;
  teams?: FixtureTeams;
  resolveOutcomeLogo?: (outcomeName: string) => string | null;
  /** Season-winner groups use team-name outcomes, not match bet types. */
  isOutrightGroup?: boolean;
}

function MarketRow({
  market,
  isSelected,
  onSelect,
  onSelectOutcome,
  displayName,
  yesLabel,
  noLabel,
  teamLogo,
  isDraw,
}: {
  market: GroupMarketDetail;
  isSelected: boolean;
  onSelect: () => void;
  onSelectOutcome: (outcomeIndex: 0 | 1) => void;
  displayName: string;
  yesLabel: string;
  noLabel: string;
  teamLogo?: string | null;
  isDraw?: boolean;
}) {
  const pct = Math.round(market.yesPrice);

  return (
    <div
      className={`w-full px-4 py-3.5 flex items-center justify-between gap-4 transition-all ${
        isSelected
          ? "relative z-10 my-0.5 rounded-lg border-2 border-cyan-400 bg-cyan-400/15 shadow-[0_0_16px_rgba(34,211,238,0.2)]"
          : "border-b border-default-100/50 last:border-b-0 hover:bg-default-100/40"
      }`}
    >
      <button
        className="flex flex-1 min-w-0 items-center gap-3.5 text-left"
        type="button"
        onClick={onSelect}
      >
        {isDraw ?
          <DrawOutcomeIcon className="shrink-0" size="row" />
        : teamLogo ?
          <TeamLogo className="shrink-0" name={displayName} size="row" src={teamLogo} />
        : null}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className={`text-sm min-w-0 ${
              displayName.includes("?") ? "whitespace-normal leading-snug" : "truncate"
            } ${isSelected ? "font-semibold text-cyan-300" : "font-medium"}`}
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
  resolveOutcomeLogo,
}: {
  section: MatchMarketSection;
  selectedMarketId: string | null;
  onSelectMarket: (marketId: string, outcomeIndex?: 0 | 1) => void;
  locale: Parameters<typeof formatSubMarketLabel>[1];
  teams?: FixtureTeams;
  yesLabel: string;
  noLabel: string;
  resolveOutcomeLogo?: (outcomeName: string) => string | null;
}) {
  if (section.id === "1x2" && teams) {
    return (
      <OneXTwoMarketSection
        markets={section.markets}
        selectedMarketId={selectedMarketId}
        teams={teams}
        onSelectMarket={onSelectMarket}
      />
    );
  }

  if (isBinaryPairMarketType(section.id)) {
    return (
      <BinaryMarketTypeSection
        locale={locale}
        marketType={section.id}
        markets={section.markets}
        selectedMarketId={selectedMarketId}
        onSelectMarket={onSelectMarket}
      />
    );
  }

  return (
    <div className="flex flex-col">
      {section.markets.map((market) => {
        const displayName = formatSubMarketLabel(market.name, locale, teams);

        return (
          <MarketRow
            key={market.marketId}
            displayName={displayName}
            isDraw={market.marketType === "1x2" && market.outcomeKey === "draw"}
            isSelected={market.marketId === selectedMarketId}
            market={market}
            noLabel={noLabel}
            teamLogo={
              getOutcomeTeamLogo(
                market.marketType,
                market.outcomeKey,
                teams,
              ) ??
              resolveOutcomeLogo?.(market.name) ??
              resolveOutcomeLogo?.(displayName) ??
              null
            }
            yesLabel={yesLabel}
            onSelect={() => onSelectMarket(market.marketId, 0)}
            onSelectOutcome={(outcomeIndex) =>
              onSelectMarket(market.marketId, outcomeIndex)
            }
          />
        );
      })}
    </div>
  );
}

function MarketTypeTabBar({
  sections,
  activeTab,
  onChange,
}: {
  sections: MatchMarketSection[];
  activeTab: string;
  onChange: (sectionId: string) => void;
}) {
  return (
    <div
      className="flex gap-1 overflow-x-auto px-4 pt-3 pb-2 border-b border-default-100 [scrollbar-width:thin]"
      role="tablist"
      aria-label="Match market categories"
    >
      {sections.map((section) => {
        const isActive = section.id === activeTab;
        const isPrimary =
          section.id !== "other" && PRIMARY_TAB_TYPES.has(section.id);

        return (
          <button
            key={section.id}
            aria-selected={isActive}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors whitespace-nowrap ${
              isActive
                ? "bg-primary/15 text-primary font-semibold shadow-sm"
                : "text-default-500 hover:bg-default-100 hover:text-foreground"
            } ${isPrimary && !isActive ? "font-medium" : ""}`}
            role="tab"
            type="button"
            onClick={() => onChange(section.id)}
          >
            {section.label}
          </button>
        );
      })}
    </div>
  );
}

export function GroupOutcomesList({
  markets,
  selectedMarketId,
  onSelectMarket,
  teams,
  resolveOutcomeLogo,
  isOutrightGroup = false,
}: GroupOutcomesListProps) {
  const { brandId, locale } = useBrand();
  const { yes: yesLabel, no: noLabel } = getCommonYesNo(locale);
  const sections = useMemo(
    () =>
      groupMarketsBySection(markets, {
        brandId,
        locale,
        forMatchDetail: true,
        allowOutrightOutcomes: isOutrightGroup,
      }),
    [markets, brandId, locale, isOutrightGroup],
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

  const activeSection =
    sections.find((section) => section.id === activeTab) ?? sections[0];

  const cardTitle =
    sections.length === 1
      ? sections[0].label
      : isOutrightGroup
        ? "Outright winner"
        : "Match Markets";

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">
          {sections.length > 1 ? (isOutrightGroup ? "Outright winner" : "Match Markets") : cardTitle}
        </h2>
      </CardHeader>
      <CardBody className="gap-0 p-0">
        {sections.length === 0 ? (
          <div className="px-4 py-6 text-sm text-default-400">
            No active markets in this group yet.
          </div>
        ) : useTabs ? (
          <>
            <MarketTypeTabBar
              activeTab={activeTab ?? sections[0].id}
              sections={sections}
              onChange={setActiveTab}
            />
            {activeSection && (
              <SectionBlock
                locale={locale}
                noLabel={noLabel}
                resolveOutcomeLogo={resolveOutcomeLogo}
                section={activeSection}
                selectedMarketId={selectedMarketId}
                teams={teams}
                yesLabel={yesLabel}
                onSelectMarket={onSelectMarket}
              />
            )}
          </>
        ) : (
          sections.map((section) => (
            <SectionBlock
              key={section.id}
              locale={locale}
              noLabel={noLabel}
              resolveOutcomeLogo={resolveOutcomeLogo}
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
