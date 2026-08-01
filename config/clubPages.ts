/** Featured club landing pages — extend as more teams get dedicated SEO hubs. */
export interface ClubPageConfig {
  slug: string;
  /** Display name in nav/footer */
  label: string;
  /** Substrings matched against home/away team names in fixture titles */
  nameMatches: string[];
}

export const CLUB_PAGES: ClubPageConfig[] = [
  {
    slug: "coventry",
    label: "Coventry",
    nameMatches: ["Coventry", "Coventry City"],
  },
];

export function getClubPage(slug: string): ClubPageConfig | undefined {
  return CLUB_PAGES.find((club) => club.slug === slug);
}

export function fixtureTitleMatchesClub(
  title: string,
  club: ClubPageConfig,
): boolean {
  const lower = title.toLowerCase();

  return club.nameMatches.some((name) =>
    lower.includes(name.toLowerCase()),
  );
}
