import type { FormattedMarketGroup } from "@/features/market-groups/types";

import { parseLeagueSlugFromTags } from "@/config/leagues";
import { LIVE_LEAGUE_SLUGS } from "@/config/liveLeagues";
import { kickoffUnixFromTags } from "@/lib/markets/filterMatchGroups";

/**
 * Round-robin across leagues so the homepage isn't flooded by one recent import
 * (e.g. Saudi Pro League).
 */
export function diversifyMatchGroupsByLeague(
  groups: FormattedMarketGroup[],
  maxTotal: number,
  maxPerLeague = 3,
): FormattedMarketGroup[] {
  if (groups.length === 0 || maxTotal <= 0) return [];

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
    ...LIVE_LEAGUE_SLUGS.filter((slug) => buckets.has(slug)),
    ...Array.from(buckets.keys()).filter(
      (slug) => !(LIVE_LEAGUE_SLUGS as readonly string[]).includes(slug),
    ),
  ];

  const taken = new Map<string, number>();
  const result: FormattedMarketGroup[] = [];
  let progress = true;

  while (result.length < maxTotal && progress) {
    progress = false;

    for (const slug of leagueOrder) {
      if (result.length >= maxTotal) break;

      const used = taken.get(slug) ?? 0;

      if (used >= maxPerLeague) continue;

      const bucket = buckets.get(slug);

      if (!bucket || used >= bucket.length) continue;

      result.push(bucket[used]!);
      taken.set(slug, used + 1);
      progress = true;
    }
  }

  return result;
}
