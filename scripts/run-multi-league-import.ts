/**
 * Import 1X2 match groups for many API-Football leagues in one run.
 *
 * Usage:
 *   npx tsx scripts/run-multi-league-import.ts --dry-run
 *   npx tsx scripts/run-multi-league-import.ts --create --max-rounds=5
 *   npx tsx scripts/run-multi-league-import.ts --create --league-ids=89,40,94
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { TOP_LEAGUES } from "../config/top-leagues";

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
    // optional
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), ".env.local"));

async function main() {
  const args = process.argv.slice(2);
  const create = args.includes("--create");
  const dryRun = !create || args.includes("--dry-run");
  const maxRoundsArg = args.find((arg) => arg.startsWith("--max-rounds="));
  const leagueIdsArg = args.find((arg) => arg.startsWith("--league-ids="));
  const skipArg = args.find((arg) => arg.startsWith("--skip-ids="));

  const maxRounds = maxRoundsArg ?
    Number(maxRoundsArg.slice("--max-rounds=".length))
  : 5;

  const skipIds = new Set(
    (skipArg?.slice("--skip-ids=".length) ?? "39")
      .split(",")
      .map((entry) => Number(entry.trim()))
      .filter((id) => Number.isFinite(id)),
  );

  let leagueIds: number[];

  if (leagueIdsArg) {
    leagueIds = leagueIdsArg
      .slice("--league-ids=".length)
      .split(",")
      .map((entry) => Number(entry.trim()))
      .filter((id) => Number.isFinite(id) && id > 0);
  } else {
    leagueIds = TOP_LEAGUES.map((league) => league.id);
  }

  leagueIds = [...new Set(leagueIds)].filter((id) => !skipIds.has(id));

  const { runFetchMatchesJob } = await import("../lib/cron/fetch-matches-job");

  const summary = {
    startedAt: new Date().toISOString(),
    dryRun,
    maxRounds,
    leagues: leagueIds.length,
    results: [] as Array<{
      leagueId: number;
      tag: string;
      fetched: number;
      planned?: number;
      created: number;
      skipped: number;
      failed: number;
    }>,
  };

  let totalCreated = 0;
  let totalPlanned = 0;
  let totalFailed = 0;

  for (const leagueId of leagueIds) {
    const meta = TOP_LEAGUES.find((league) => league.id === leagueId);
    const label = meta?.tag ?? `League ${leagueId}`;

    console.log(`\n[multi-import] ${dryRun ? "Dry run" : "Creating"} ${label} (${leagueId})…`);

    try {
      const result = await runFetchMatchesJob({
        leagueId,
        maxRounds,
        season: 2026,
        dryRun,
      });

      summary.results.push({
        leagueId,
        tag: label,
        fetched: result.fetched,
        planned: result.planned,
        created: result.created,
        skipped: result.skipped,
        failed: result.failed,
      });

      totalCreated += result.created;
      totalPlanned += result.planned ?? 0;
      totalFailed += result.failed;

      console.log(
        `[multi-import] ${label}: fetched=${result.fetched} planned=${result.planned ?? 0} created=${result.created} skipped=${result.skipped} failed=${result.failed}`,
      );
    } catch (error) {
      console.error(`[multi-import] ${label} failed`, error);
      summary.results.push({
        leagueId,
        tag: label,
        fetched: 0,
        created: 0,
        skipped: 0,
        failed: 1,
      });
      totalFailed += 1;
    }
  }

  const report = {
    ...summary,
    finishedAt: new Date().toISOString(),
    totalPlanned,
    totalCreated,
    totalFailed,
  };

  writeFileSync(
    resolve(process.cwd(), ".multi-league-import-summary.json"),
    JSON.stringify(report, null, 2),
  );

  console.log("\n[multi-import] Done", report);
}

main().catch((error) => {
  console.error("[multi-import] fatal:", error);
  process.exit(1);
});
