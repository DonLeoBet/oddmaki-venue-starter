import type { FormattedMarketGroup } from "@/features/market-groups/types";

import { parseLeagueSlugFromTags } from "@/config/leagues";
import { kickoffUnixFromTags } from "@/lib/markets/filterMatchGroups";

/** Big European leagues — prefer these on the homepage mix. */
export const HOMEPAGE_PRIORITY_LEAGUES = [
  "premier-league",
  "eredivisie",
  "champions-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "ligue-1",
  "championship",
  "europa-league",
  "primeira-liga",
  "super-lig",
] as const;

/** Cap how many cards smaller leagues can take on the homepage. */
export const HOMEPAGE_MINOR_LEAGUE_MAX = 1;

export const HOMEPAGE_PRIORITY_MAX_PER = 3;

/**
 * Round-robin across leagues with priority for top competitions so
 * Saudi / Austrian floods don't dominate the homepage.
 */
export function diversifyMatchGroupsByLeague(
  groups: FormattedMarketGroup[],
  maxTotal: number,
  maxPerLeague = HOMEPAGE_PRIORITY_MAX_PER,
  options?: {
    priorityLeagues?: readonly string[];
    minorLeagueMax?: number;
  },
): FormattedMarketGroup[] {
  if (groups.length === 0 || maxTotal <= 0) return [];

  const priority = options?.priorityLeagues ?? HOMEPAGE_PRIORITY_LEAGUES;
  const minorMax = options?.minorLeagueMax ?? HOMEPAGE_MINOR_LEAGUE_MAX;
  const prioritySet = new Set<string>(priority);

  const buckets = new Map<string, FormattedMarketGroup[]>();

  for (const group of groups) {
    const slug = parseLeagueSlugFromTags(group.tags ?? []) ?? "other";
    const list = buckets.get(slug);

    if (list) list.push(group);
    else buckets.set(slug, [group]);
  }

  for (const list of Array.from(buckets.values())) {
    list.sort(
      (a: FormattedMarketGroup, b: FormattedMarketGroup) =>
        (kickoffUnixFromTags(a.tags) ?? Number.MAX_SAFE_INTEGER) -
        (kickoffUnixFromTags(b.tags) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  const leagueOrder = [
    ...priority.filter((slug) => buckets.has(slug)),
    ...Array.from(buckets.keys()).filter((slug) => !prioritySet.has(slug)),
  ];

  const taken = new Map<string, number>();
  const result: FormattedMarketGroup[] = [];
  let progress = true;

  while (result.length < maxTotal && progress) {
    progress = false;

    for (const slug of leagueOrder) {
      if (result.length >= maxTotal) break;

      const used = taken.get(slug) ?? 0;
      const cap = prioritySet.has(slug) ? maxPerLeague : minorMax;

      if (used >= cap) continue;

      const bucket = buckets.get(slug);

      if (!bucket || used >= bucket.length) continue;

      result.push(bucket[used]!);
      taken.set(slug, used + 1);
      progress = true;
    }
  }

  return result;
}
