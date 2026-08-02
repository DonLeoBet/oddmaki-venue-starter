import { resolveBrandId } from "@/config/brandRouting";
import { BRAND_CONFIG } from "@/config/brand.config";
import { CLUB_PAGES } from "@/config/clubPages";
import { LIVE_LEAGUE_SLUGS } from "@/config/liveLeagues";
import { createReadOnlyClient } from "@/lib/admin/fixtures-service";
import { getVenueId } from "@/config/venue.config";
import { filterMatchGroupsForFeed } from "@/lib/markets/filterMatchGroups";
import { fetchAllMatchGroupsFromUnifiedFeed } from "@/lib/markets/fetchMatchGroups";
import { getMatchGroupSeoPath } from "@/features/market-groups/utils/matchGroupPaths";

export interface SitemapUrlEntry {
  path: string;
  lastModified?: Date;
}

const STATIC_PATHS = ["/", "/info", "/about", "/blog", "/leaderboard"];

/** Paths for Search Console — active fixtures + league hubs. */
export async function fetchSitemapUrlEntries(): Promise<SitemapUrlEntry[]> {
  const venueId = getVenueId();
  const entries: SitemapUrlEntry[] = STATIC_PATHS.map((path) => ({ path }));

  for (const club of CLUB_PAGES) {
    entries.push({ path: `/clubs/${club.slug}` });
  }

  for (const league of LIVE_LEAGUE_SLUGS) {
    entries.push({ path: `/?category=${league}` });
  }

  if (venueId === undefined) {
    return entries;
  }

  try {
    const client = createReadOnlyClient();
    const raw = await fetchAllMatchGroupsFromUnifiedFeed(client, venueId, "volume");
    const brandId = resolveBrandId(BRAND_CONFIG.id);
    const locale = BRAND_CONFIG.defaultLocale;

    const groups = filterMatchGroupsForFeed(raw, {
      statusFilter: "Active",
      liveLeaguesOnly: true,
    });

    for (const group of groups) {
      const path = getMatchGroupSeoPath(
        brandId,
        {
          groupId: group.groupId,
          marketQuestion: group.marketQuestion,
          tags: group.tags,
        },
        locale,
      );

      if (!path) continue;

      const kickoffTag = group.tags?.find((tag) => tag.startsWith("kickoff-"));
      const kickoffUnix = kickoffTag
        ? Number(kickoffTag.slice("kickoff-".length))
        : NaN;

      entries.push({
        path,
        lastModified:
          Number.isFinite(kickoffUnix) && kickoffUnix > 0
            ? new Date(kickoffUnix * 1000)
            : undefined,
      });
    }
  } catch (error) {
    console.error("[sitemap] failed to fetch match groups:", error);
  }

  return entries;
}
