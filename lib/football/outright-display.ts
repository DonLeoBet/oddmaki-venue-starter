import { LEAGUE_BY_ID } from "@/config/leagues";
import { getTopLeagueById } from "@/config/top-leagues";
import { formatSeasonLabel } from "@/lib/football/season";
import { parseOutrightTag } from "@/lib/markets/marketFilters";

export const API_SPORTS_LEAGUE_LOGO_BASE =
  "https://media.api-sports.io/football/leagues";

const logoUrlByLeagueId = new Map<number, string>();

export function apiSportsLeagueLogoUrl(leagueId: number): string {
  const cached = logoUrlByLeagueId.get(leagueId);

  if (cached) return cached;

  const url = `${API_SPORTS_LEAGUE_LOGO_BASE}/${leagueId}.png`;

  logoUrlByLeagueId.set(leagueId, url);

  return url;
}

export interface OutrightCardMeta {
  leagueId: number | null;
  leagueName: string;
  season: number | null;
  seasonLabel: string | null;
  logoUrl: string | null;
}

/** Derive league crest + labels for homepage outright cards. */
export function getOutrightCardMeta(
  tags: string[] | undefined,
  marketQuestion: string,
): OutrightCardMeta {
  const outrightTag = tags?.find((tag) => tag.startsWith("outright-"));
  const parsed = outrightTag ? parseOutrightTag(outrightTag) : null;
  const leagueFromId =
    parsed?.leagueId != null ? LEAGUE_BY_ID[parsed.leagueId] : undefined;
  const topLeague =
    parsed?.leagueId != null ? getTopLeagueById(parsed.leagueId) : undefined;

  const leagueName =
    leagueFromId?.tag ??
    topLeague?.tag ??
    tags?.find(
      (tag) =>
        tag !== "outrights" &&
        tag !== "sports" &&
        !tag.startsWith("outright-") &&
        !tag.endsWith(" Football"),
    ) ??
    marketQuestion.replace(/\s*[-—].*$/, "").trim();

  const leagueId = parsed?.leagueId ?? leagueFromId?.id ?? topLeague?.id ?? null;
  const season = parsed?.season ?? null;

  return {
    leagueId,
    leagueName,
    season,
    seasonLabel: season != null ? formatSeasonLabel(season) : null,
    logoUrl: leagueId != null ? apiSportsLeagueLogoUrl(leagueId) : null,
  };
}
