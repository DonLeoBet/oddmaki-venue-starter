const TEAM_SUFFIXES =
  /\b(fc|afc|cf|sc|ac|as|ss|us|cd|ud|sd|rc|fk|sk|bk|if|ff|sv|vfb|tsv|fsv|rb|bsc|1\.?\s*fc)\b\.?/gi;

/** Normalize club names for fuzzy outright outcome matching. */
export function normalizeTeamName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(TEAM_SUFFIXES, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface TeamLogoLookupEntry {
  name: string;
  logo: string | null;
}

/** Resolve a crest URL when an outright outcome name matches a league squad entry. */
export function findTeamLogoForOutcome(
  outcomeName: string,
  teams: TeamLogoLookupEntry[],
): string | null {
  const normalized = normalizeTeamName(outcomeName);

  if (!normalized) return null;

  for (const team of teams) {
    const teamNorm = normalizeTeamName(team.name);

    if (teamNorm === normalized) return team.logo;

    if (
      teamNorm.length >= 4 &&
      normalized.length >= 4 &&
      (teamNorm.includes(normalized) || normalized.includes(teamNorm))
    ) {
      return team.logo;
    }
  }

  return null;
}
