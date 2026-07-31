import type { FixtureTeamSide } from "./fixture-teams";

/** CDN pattern used by API-Football for team crests. */
export const API_SPORTS_TEAM_LOGO_BASE =
  "https://media.api-sports.io/football/teams";

const logoUrlByTeamId = new Map<number, string>();

export interface TeamLogoSource {
  id?: number;
  name?: string;
  logo?: string | null;
}

export function apiSportsTeamLogoUrl(teamId: number): string {
  const cached = logoUrlByTeamId.get(teamId);

  if (cached) return cached;

  const url = `${API_SPORTS_TEAM_LOGO_BASE}/${teamId}.png`;

  logoUrlByTeamId.set(teamId, url);

  return url;
}

/**
 * Resolve a team crest URL.
 * Prefers API-Football `logo` field; falls back to the standard CDN URL by team id.
 */
export function getTeamLogo(
  team: TeamLogoSource,
  _leagueSlug?: string,
): string | null {
  const direct = team.logo?.trim();

  if (direct) return direct;

  if (team.id != null && team.id > 0) {
    return apiSportsTeamLogoUrl(team.id);
  }

  return null;
}

export function toFixtureTeamSide(team: TeamLogoSource): FixtureTeamSide | null {
  const name = team.name?.trim();

  if (!name || team.id == null || team.id <= 0) return null;

  return {
    id: team.id,
    name,
    logo: getTeamLogo(team),
  };
}
