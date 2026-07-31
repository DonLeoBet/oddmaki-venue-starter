"use client";

import type { FormattedMarketGroup } from "../types";

import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import NextLink from "next/link";

import { MarketGroupStatus } from "../types";
import { useBrand } from "@/features/brand";
import { getOverviewCardMarketTypes } from "@/config/brandMarkets";
import {
  groupOutcomesForOverview,
  type OverviewMarketTypeRow,
  type OverviewOutcomeChip,
} from "@/features/markets/utils/overviewMarkets";
import { MatchCardHeader } from "./overview/MatchCardHeader";
import { OneXTwoOverviewRow } from "./overview/OneXTwoOverviewRow";
import { alpha, colors } from "@/lib/tokens";
import { getMatchGroupHref } from "@/features/market-groups/utils/matchGroupPaths";

interface MarketGroupCardProps {
  group: FormattedMarketGroup;
}

function OutcomeChip({
  chip,
  isWinner,
  isResolved,
}: {
  chip: OverviewOutcomeChip;
  isWinner: boolean;
  isResolved: boolean;
}) {
  const pct = Math.round(chip.probability);

  return (
    <span
      className={`text-xs rounded-lg px-2 py-0.5 font-medium whitespace-nowrap ${
        isResolved && isWinner ?
          "bg-primary/20 text-primary"
        : "bg-default-100 text-default-600"
      }`}
    >
      {chip.label} {pct}%
    </span>
  );
}

function BinaryOverviewRow({
  section,
  isResolved,
  resolvedMarketId,
}: {
  section: OverviewMarketTypeRow;
  isResolved: boolean;
  resolvedMarketId: string;
}) {
  const positiveKey = section.marketType === "btts" ? "yes" : "over";
  const negativeKey = section.marketType === "btts" ? "no" : "under";
  const positive = section.outcomes.find((o) => o.outcomeKey === positiveKey);
  const negative = section.outcomes.find((o) => o.outcomeKey === negativeKey);

  if (!positive || !negative) {
    return (
      <MarketTypeOverviewRow
        isResolved={isResolved}
        resolvedMarketId={resolvedMarketId}
        section={section}
      />
    );
  }

  const posPct = Math.round(positive.probability);
  const negPct = Math.round(negative.probability);

  return (
    <div className="py-2">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-default-400">
        {section.label}
      </span>
      <div className="flex gap-1.5">
        <div
          className="flex-1 rounded-lg border py-1.5 text-center"
          style={{
            backgroundColor: alpha(colors.neonCyan, 0.1),
            borderColor: alpha(colors.neonCyan, 0.25),
          }}
        >
          <span className="block text-[10px] font-semibold text-primary">
            {positive.label}
          </span>
          <span className="block text-sm font-bold text-primary tabular-nums">
            {posPct}%
          </span>
        </div>
        <div
          className="flex-1 rounded-lg border py-1.5 text-center"
          style={{
            backgroundColor: alpha(colors.neonMagenta, 0.1),
            borderColor: alpha(colors.neonMagenta, 0.25),
          }}
        >
          <span className="block text-[10px] font-semibold text-secondary">
            {negative.label}
          </span>
          <span className="block text-sm font-bold text-secondary tabular-nums">
            {negPct}%
          </span>
        </div>
      </div>
    </div>
  );
}

function MarketTypeOverviewRow({
  section,
  isResolved,
  resolvedMarketId,
}: {
  section: OverviewMarketTypeRow;
  isResolved: boolean;
  resolvedMarketId: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-default-400 flex-shrink-0 pt-0.5">
        {section.label}
      </span>
      <div className="flex flex-wrap gap-1 justify-end">
        {section.outcomes.map((chip) => (
          <OutcomeChip
            key={chip.marketId}
            chip={chip}
            isResolved={isResolved}
            isWinner={chip.marketId === resolvedMarketId}
          />
        ))}
      </div>
    </div>
  );
}

function OverviewSectionRow({
  section,
  isResolved,
  resolvedMarketId,
}: {
  section: OverviewMarketTypeRow;
  isResolved: boolean;
  resolvedMarketId: string;
}) {
  if (section.marketType === "1x2") {
    return (
      <OneXTwoOverviewRow
        isResolved={isResolved}
        outcomes={section.outcomes}
        resolvedMarketId={resolvedMarketId}
      />
    );
  }

  if (
    section.marketType === "btts" ||
    section.marketType === "ou25"
  ) {
    return (
      <BinaryOverviewRow
        isResolved={isResolved}
        resolvedMarketId={resolvedMarketId}
        section={section}
      />
    );
  }

  return (
    <MarketTypeOverviewRow
      isResolved={isResolved}
      resolvedMarketId={resolvedMarketId}
      section={section}
    />
  );
}

export function MarketGroupCard({ group }: MarketGroupCardProps) {
  const { brandId, locale } = useBrand();
  const overviewMarketTypes = getOverviewCardMarketTypes(brandId);
  const parsedTitle = group.marketQuestion.match(/^(.+?)\s+vs\s+(.+?)\s+—/i);
  const teams =
    parsedTitle ?
      {
        home: { name: parsedTitle[1].trim() },
        away: { name: parsedTitle[2].trim() },
      }
    : undefined;
  const sections = groupOutcomesForOverview(
    group.outcomes,
    locale,
    teams,
    overviewMarketTypes,
  );
  const isResolved = group.status === MarketGroupStatus.RESOLVED;
  const detailHref = getMatchGroupHref(
    brandId,
    {
      groupId: group.groupId,
      marketQuestion: group.marketQuestion,
      tags: group.tags,
    },
    locale,
  );

  return (
    <Card className="w-full min-h-[200px] border border-default-100/50">
      <CardHeader className="flex flex-col items-start gap-2 pt-4 pb-0 flex-shrink-0">
        <MatchCardHeader group={group} />
      </CardHeader>

      <CardBody className="gap-0 py-2 overflow-y-auto flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.length === 0 ?
          <p className="text-xs text-default-400 px-1 py-2">No markets yet</p>
        : <div className="flex flex-col divide-y divide-default-100/80">
            {sections.map((section) => (
              <OverviewSectionRow
                key={section.marketType}
                isResolved={isResolved}
                resolvedMarketId={group.resolvedMarketId}
                section={section}
              />
            ))}
          </div>
        }
      </CardBody>

      <CardFooter className="flex-shrink-0">
        <div className="flex justify-between items-center w-full text-xs">
          <span className="text-default-400">{group.volumeFormatted} Vol.</span>
          <NextLink
            className="font-semibold text-primary hover:underline"
            href={detailHref}
          >
            All markets
          </NextLink>
        </div>
      </CardFooter>
    </Card>
  );
}
