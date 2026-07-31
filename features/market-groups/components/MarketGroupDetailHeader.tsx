"use client";

import type { FormattedMarketGroup } from "../types";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { useRouter } from "next/navigation";

import { ArrowBackIcon } from "@/components/icons";
import { MarketSettingsButton } from "@/features/market-settings";
import { useBrand } from "@/features/brand";
import { buildMatchSeo } from "@/config/brandSeo";
import { getLeagueName, parseLeagueSlugFromTags } from "@/config/leagues";
import { formatSearchKickoff } from "@/features/markets/utils/matchMarketSearch";
import { KICKOFF_TAG_PREFIX } from "@/lib/football/constants";

interface MarketGroupDetailHeaderProps {
  group: FormattedMarketGroup;
  selectedMarketId: string | null;
  home?: string;
  away?: string;
}

const STATUS_COLOR: Record<
  string,
  "warning" | "primary" | "default" | "danger"
> = {
  Draft: "warning",
  Active: "primary",
  Resolved: "default",
};

function kickoffFromTags(tags: string[]): string {
  const tag = tags.find((entry) => entry.startsWith(KICKOFF_TAG_PREFIX));

  if (!tag) return "";

  const unix = Number(tag.slice(KICKOFF_TAG_PREFIX.length));

  return Number.isFinite(unix) ? formatSearchKickoff(unix) : "";
}

export function MarketGroupDetailHeader({
  group,
  selectedMarketId,
  home,
  away,
}: MarketGroupDetailHeaderProps) {
  const router = useRouter();
  const { brandId, brandName, locale } = useBrand();
  const leagueSlug = parseLeagueSlugFromTags(group.tags ?? []);
  const leagueName = leagueSlug ? getLeagueName(leagueSlug, locale) : null;
  const kickoff = kickoffFromTags(group.tags ?? []);
  const matchSeo =
    home && away ?
      buildMatchSeo(brandId, brandName, home, away)
    : null;
  const title = matchSeo?.h1 ?? group.marketQuestion;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2 flex-1">
          <Button
            isIconOnly
            aria-label="Back to markets"
            className="mt-0.5"
            size="sm"
            variant="light"
            onPress={() => router.push("/")}
          >
            <ArrowBackIcon size={20} />
          </Button>
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="text-2xl font-bold">{title}</h1>
            {(leagueName || kickoff) && (
              <div className="flex flex-wrap items-center gap-2">
                {leagueName && (
                  <Chip size="sm" variant="flat">
                    {leagueName}
                  </Chip>
                )}
                {kickoff && (
                  <span className="text-sm text-default-400">{kickoff}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            color={STATUS_COLOR[group.status] || "default"}
            size="sm"
            variant="flat"
          >
            {group.status}
          </Chip>
          {selectedMarketId && (
            <MarketSettingsButton
              marketCreator={group.creator}
              marketId={selectedMarketId}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col">
          <span className="text-xs text-default-400 uppercase">Markets</span>
          <span className="text-lg font-semibold">
            {group.activeMarketCount}
            {group.totalMarkets !== group.activeMarketCount &&
              ` / ${group.totalMarkets}`}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-default-400 uppercase">Volume</span>
          <span className="text-lg font-semibold">{group.volumeFormatted}</span>
        </div>

        {group.resolvedMarketId !== "0" && (
          <div className="flex flex-col">
            <span className="text-xs text-default-400 uppercase">Winner</span>
            <span className="text-lg font-semibold text-primary">
              Market #{group.resolvedMarketId}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
