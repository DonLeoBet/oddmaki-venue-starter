"use client";

import type { FormattedMarketGroup } from "../types";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { useRouter } from "next/navigation";

import { ArrowBackIcon } from "@/components/icons";
import { MatchTeamLogos } from "@/components/football/TeamLogo";
import { MarketSettingsButton } from "@/features/market-settings";
import { useBrand } from "@/features/brand";
import { buildMatchSeo } from "@/config/brandSeo";
import { getLeagueName, parseLeagueSlugFromTags } from "@/config/leagues";
import { formatKickoffFromGroup } from "@/lib/football/kickoff-display";
import type { FixtureTeams } from "@/lib/markets/marketDisplay";

interface MarketGroupDetailHeaderProps {
  group: FormattedMarketGroup;
  selectedMarketId: string | null;
  teams?: FixtureTeams;
}

const STATUS_COLOR: Record<
  string,
  "warning" | "primary" | "default" | "danger"
> = {
  Draft: "warning",
  Active: "primary",
  Resolved: "default",
};

function kickoffFromTags(tags: string[], title?: string): string {
  return formatKickoffFromGroup(tags, title);
}

export function MarketGroupDetailHeader({
  group,
  selectedMarketId,
  teams,
}: MarketGroupDetailHeaderProps) {
  const router = useRouter();
  const { brandId, brandName, locale } = useBrand();
  const leagueSlug = parseLeagueSlugFromTags(group.tags ?? []);
  const leagueName = leagueSlug ? getLeagueName(leagueSlug, locale) : null;
  const kickoff = kickoffFromTags(group.tags ?? [], group.marketQuestion);
  const matchSeo =
    teams ?
      buildMatchSeo(brandId, brandName, teams.home.name, teams.away.name)
    : null;
  const title = matchSeo?.h1 ?? group.marketQuestion;

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="flex items-start gap-1.5 flex-1 min-w-0 sm:gap-2">
          <Button
            isIconOnly
            aria-label="Back to markets"
            className="mt-0.5 shrink-0"
            size="sm"
            variant="light"
            onPress={() => router.push("/")}
          >
            <ArrowBackIcon size={20} />
          </Button>
          <div className="flex flex-col gap-2 min-w-0 sm:gap-3">
            {teams ?
              <div className="flex flex-col gap-2 min-w-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                <MatchTeamLogos
                  away={teams.away}
                  home={teams.home}
                  size="sm"
                />
                <h1 className="text-lg font-bold min-w-0 break-words leading-tight sm:text-2xl">
                  {teams.home.name} vs {teams.away.name}
                </h1>
              </div>
            : <h1 className="text-lg font-bold break-words sm:text-2xl">
                {title}
              </h1>}
            {(leagueName || kickoff) && (
              <div className="flex flex-wrap items-center gap-2">
                {leagueName && (
                  <Chip size="sm" variant="flat">
                    {leagueName}
                  </Chip>
                )}
                {kickoff && (
                  <span className="text-xs text-default-400 sm:text-sm">
                    {kickoff}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
