/**
 * Bulk-import outright (long-term) markets for all configured TOP_LEAGUES.
 *
 * Usage:
 *   npx tsx scripts/run-outright-import.ts              # dry-run (API fetch only)
 *   npx tsx scripts/run-outright-import.ts --create     # on-chain create (skips existing)
 *   npx tsx scripts/run-outright-import.ts --discover-world              # dry-run worldwide 2026
 *   npx tsx scripts/run-outright-import.ts --create --discover-world     # on-chain create
 *   npx tsx scripts/run-outright-import.ts --create --discover-world --season=2026
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path: string) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // optional file
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), ".env.local"));

async function main() {
  const args = process.argv.slice(2);
  const create = args.includes("--create");
  const discoverWorld = args.includes("--discover-world");
  const leagueArg = args.find((arg) => arg.startsWith("--league-ids="));
  const seasonArg = args.find((arg) => arg.startsWith("--season="));
  const season = seasonArg ?
    Number(seasonArg.slice("--season=".length))
  : undefined;
  const leagueIds =
    leagueArg ?
      leagueArg
        .slice("--league-ids=".length)
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isFinite(id) && id > 0)
    : undefined;

  const { runFetchOutrightsJob } = await import(
    "../lib/cron/fetch-outrights-job"
  );

  console.log(
    create ?
      `[outright-import] Creating missing outright markets…`
    : `[outright-import] Dry run — fetching teams only…`,
  );

  const summary = await runFetchOutrightsJob({
    dryRun: !create,
    leagueIds,
    season: Number.isFinite(season) && season! > 0 ? season : undefined,
    discoverWorld,
  });

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("[outright-import] failed:", error);
  process.exit(1);
});
