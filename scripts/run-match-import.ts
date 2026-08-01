/**
 * Import match market groups for one league (optionally limited to first N rounds).
 *
 * Usage:
 *   npx tsx scripts/run-match-import.ts --league-id=39 --max-rounds=5
 *   npx tsx scripts/run-match-import.ts --league-id=39 --max-rounds=5 --create
 *   npx tsx scripts/run-match-import.ts --league-id=39 --max-rounds=5 --create --season=2026
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
  const leagueArg = args.find((arg) => arg.startsWith("--league-id="));
  const maxRoundsArg = args.find((arg) => arg.startsWith("--max-rounds="));
  const seasonArg = args.find((arg) => arg.startsWith("--season="));

  const leagueId = leagueArg ? Number(leagueArg.slice("--league-id=".length)) : NaN;
  const maxRounds = maxRoundsArg ?
    Number(maxRoundsArg.slice("--max-rounds=".length))
  : NaN;
  const season = seasonArg ? Number(seasonArg.slice("--season=".length)) : undefined;

  if (!Number.isFinite(leagueId) || leagueId <= 0) {
    console.error("Missing or invalid --league-id=<api-football league id>");
    process.exit(1);
  }

  if (!Number.isFinite(maxRounds) || maxRounds <= 0) {
    console.error("Missing or invalid --max-rounds=<N>");
    process.exit(1);
  }

  const { runFetchMatchesJob } = await import("../lib/cron/fetch-matches-job");

  console.log(
    create ?
      `[match-import] Creating match markets league=${leagueId} rounds 1-${maxRounds}…`
    : `[match-import] Dry run league=${leagueId} rounds 1-${maxRounds}…`,
  );

  const summary = await runFetchMatchesJob({
    leagueId,
    maxRounds,
    season: Number.isFinite(season) && season! > 0 ? season : undefined,
    dryRun: !create,
  });

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("[match-import] failed:", error);
  process.exit(1);
});
