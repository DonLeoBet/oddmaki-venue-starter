/** Earliest kickoff for fixture markets (default 15 August — pre-launch window). */
export function getFixtureMinKickoffDateYmd(reference = new Date()): string {
  const env = process.env.FIXTURE_MIN_KICKOFF_DATE?.trim();

  if (env && /^\d{4}-\d{2}-\d{2}$/.test(env)) {
    return env;
  }

  const year = reference.getUTCFullYear();

  return `${year}-08-15`;
}

export function getFixtureMinKickoffUnix(reference = new Date()): number {
  const ymd = getFixtureMinKickoffDateYmd(reference);

  return Math.floor(Date.parse(`${ymd}T00:00:00.000Z`) / 1000);
}

export function isKickoffOnOrAfterMinDate(
  unixTimestamp: number,
  reference = new Date(),
): boolean {
  return unixTimestamp >= getFixtureMinKickoffUnix(reference);
}
