"use client";

import type { FormattedMarketGroup } from "../../types";

import { TeamLogo } from "@/components/football/TeamLogo";
import { useFixtureTeams } from "@/features/football/hooks/useFixtureTeams";
import { parseFixtureTitle } from "@/lib/football/fixture-metadata";
import { formatKickoffFromGroup } from "@/lib/football/kickoff-display";

interface MatchCardHeaderProps {
  group: FormattedMarketGroup;
}

function TeamRow({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <TeamLogo plain className="shrink-0" name={name} size="sm" src={logo} />
      <span className="truncate text-sm font-semibold leading-tight">{name}</span>
    </div>
  );
}

/** Overview card — home/away crests stacked with names beside each logo. */
export function MatchCardHeader({ group }: MatchCardHeaderProps) {
  const teams = useFixtureTeams(group);
  const parsed = parseFixtureTitle(group.marketQuestion);
  const homeName = teams?.home.name ?? parsed?.home ?? "Home";
  const awayName = teams?.away.name ?? parsed?.away ?? "Away";
  const kickoff = formatKickoffFromGroup(group.tags ?? [], group.marketQuestion);

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <TeamRow logo={teams?.home.logo} name={homeName} />
        <TeamRow logo={teams?.away.logo} name={awayName} />
      </div>
      {kickoff ?
        <time
          className="w-full shrink-0 text-[11px] leading-tight text-default-400 sm:max-w-[44%] sm:text-right"
          dateTime={kickoff}
        >
          {kickoff}
        </time>
      : null}
    </div>
  );
}
