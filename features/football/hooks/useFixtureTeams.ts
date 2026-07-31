"use client";

import type { FormattedMarketGroup } from "@/features/market-groups/types";
import type { FixtureTeamsPayload } from "@/lib/football/fixture-teams";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { FixtureTeams } from "@/lib/markets/marketDisplay";
import { parseFixtureTitle } from "@/lib/football/fixture-metadata";
import { fixtureIdFromTag, isFixtureTag } from "@/lib/football/map-fixture-to-market-group";
import { queryKeys } from "@/lib/oddmaki/queryKeys";

function fixtureIdFromTags(tags: string[]): number | null {
  for (const tag of tags) {
    if (!isFixtureTag(tag)) continue;

    return fixtureIdFromTag(tag);
  }

  return null;
}

async function fetchFixtureTeams(fixtureId: number): Promise<FixtureTeamsPayload> {
  const response = await fetch(`/api/football/fixtures/${fixtureId}`);

  if (!response.ok) {
    throw new Error(`Fixture teams unavailable (${response.status})`);
  }

  return response.json() as Promise<FixtureTeamsPayload>;
}

/** Load home/away crests for a match group via on-chain fixture id tag. */
export function useFixtureTeams(
  group: Pick<FormattedMarketGroup, "tags" | "marketQuestion"> | null | undefined,
): FixtureTeams | undefined {
  const fixtureId = useMemo(
    () => (group?.tags ? fixtureIdFromTags(group.tags) : null),
    [group?.tags],
  );

  const parsedTitle = useMemo(
    () => (group?.marketQuestion ? parseFixtureTitle(group.marketQuestion) : null),
    [group?.marketQuestion],
  );

  const { data } = useQuery({
    queryKey: queryKeys.fixtureTeams.detail(fixtureId?.toString()),
    queryFn: () => fetchFixtureTeams(fixtureId!),
    enabled: fixtureId != null,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 1,
  });

  return useMemo(() => {
    if (!parsedTitle) return undefined;

    return {
      home: {
        name: parsedTitle.home,
        id: data?.home.id,
        logo: data?.home.logo ?? null,
      },
      away: {
        name: parsedTitle.away,
        id: data?.away.id,
        logo: data?.away.logo ?? null,
      },
    };
  }, [parsedTitle, data]);
}
