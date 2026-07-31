import { OUTRIGHT_SEASON_YEAR } from "@/config/top-leagues";
import { BOT_VENUE_ID, outrightTag } from "@/lib/football/constants";
import { fetchPreparedOutrightMarketGroups } from "@/lib/football/fetch-outright-teams";
import { ACTIVE_CHAIN_ID } from "@/lib/oddmaki/chain";
import {
  createOutrightMarketGroupOnChain,
  loadExistingOutrightTags,
} from "@/lib/oddmaki/match-market-bot";
import { createBotWalletContext } from "@/lib/oddmaki/server-bot-client";

const LOG_PREFIX = "[cron/fetch-outrights]";
/** Pause between on-chain outright market groups to avoid nonce / RPC timeouts */
export const OUTRIGHT_LEAGUE_TX_DELAY_MS = 2_000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message: string, extra?: Record<string, unknown>): void {
  if (extra) {
    console.log(LOG_PREFIX, message, extra);
  } else {
    console.log(LOG_PREFIX, message);
  }
}

export function logFetchOutrightsError(message: string, error: unknown): void {
  console.error(
    LOG_PREFIX,
    message,
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
}

export class OutrightFetchError extends Error {
  constructor(
    message: string,
    readonly leagueErrors: string[] = [],
  ) {
    super(message);
    this.name = "OutrightFetchError";
  }
}

export async function runFetchOutrightsJob(options: {
  dryRun?: boolean;
  leagueIds?: number[];
  season?: number;
} = {}) {
  const season = options.season ?? OUTRIGHT_SEASON_YEAR;

  log("Starting outright market sync", {
    venueId: BOT_VENUE_ID.toString(),
    chainId: ACTIVE_CHAIN_ID,
    dryRun: options.dryRun ?? false,
    season,
    leagueIds: options.leagueIds ?? "all",
  });

  let fetchSummary;

  try {
    fetchSummary = await fetchPreparedOutrightMarketGroups({
      leagueIds: options.leagueIds,
      season,
    });
  } catch (error) {
    logFetchOutrightsError("Outright team fetch failed", error);
    throw new OutrightFetchError(
      error instanceof Error ? error.message : "Outright team fetch failed",
    );
  }

  const { groups: preparedGroups, leagueResults, errors: leagueErrors } =
    fetchSummary;

  log("Fetched outright league teams", {
    season,
    leaguesRequested: leagueResults.length,
    groupsPrepared: preparedGroups.length,
    leagueErrors: leagueErrors.length,
  });

  if (preparedGroups.length === 0) {
    throw new OutrightFetchError(
      leagueErrors.length > 0 ?
        `No outright markets could be prepared: ${leagueErrors.join(" | ")}`
      : "No outright markets could be prepared — all league team lists were empty",
      leagueErrors,
    );
  }

  if (options.dryRun) {
    return {
      venueId: BOT_VENUE_ID.toString(),
      chainId: ACTIVE_CHAIN_ID,
      botAddress: "dry-run",
      season,
      leagues: preparedGroups.length,
      fetched: preparedGroups.length,
      skipped: 0,
      created: 0,
      failed: 0,
      leagueResults,
      leagueErrors,
      results: preparedGroups.map((group) => ({
        leagueId: group.leagueId,
        season: group.season,
        status: "dry_run" as const,
        teamCount: group.outcomes.length,
        message: `Would create "${group.title}" with ${group.outcomes.length} teams`,
      })),
    };
  }

  const { client, publicClient, address } = createBotWalletContext();
  const existingTags = await loadExistingOutrightTags(client, BOT_VENUE_ID);

  log("Bot wallet initialized", {
    address,
    existingOutrightTags: existingTags.size,
  });

  const results: Array<{
    leagueId: number;
    season: number;
    status: "skipped" | "created" | "failed";
    groupId?: string;
    teamCount?: number;
    reason?: string;
    error?: string;
  }> = [];

  let skipped = 0;
  let created = 0;
  let failed = 0;

  for (let index = 0; index < preparedGroups.length; index++) {
    const prepared = preparedGroups[index];

    if (index > 0) {
      log(`Waiting ${OUTRIGHT_LEAGUE_TX_DELAY_MS}ms before next league tx`);
      await wait(OUTRIGHT_LEAGUE_TX_DELAY_MS);
    }

    const tag = outrightTag(prepared.leagueId, prepared.season);

    if (existingTags.has(tag)) {
      results.push({
        leagueId: prepared.leagueId,
        season: prepared.season,
        status: "skipped",
        reason: `Outright market already exists (${tag})`,
      });
      skipped += 1;
      continue;
    }

    log("Creating outright market group", {
      leagueId: prepared.leagueId,
      season: prepared.season,
      title: prepared.title,
      teams: prepared.outcomes.length,
    });

    try {
      const result = await createOutrightMarketGroupOnChain(
        client,
        publicClient,
        BOT_VENUE_ID,
        address,
        prepared,
      );

      if (result.status === "created") {
        existingTags.add(tag);
        created += 1;
        results.push({
          leagueId: result.leagueId,
          season: result.season,
          status: "created",
          groupId: result.groupId,
          teamCount: result.teamCount,
        });
      } else if (result.status === "failed") {
        failed += 1;
        results.push({
          leagueId: result.leagueId,
          season: result.season,
          status: "failed",
          error: result.error,
        });
        logFetchOutrightsError(
          `Failed outright market for league ${result.leagueId}`,
          result.error,
        );
      } else if (result.status === "skipped") {
        skipped += 1;
        results.push({
          leagueId: result.leagueId,
          season: result.season,
          status: "skipped",
          reason: result.reason,
        });
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);

      logFetchOutrightsError(
        `Unexpected outright create failure for league ${prepared.leagueId}`,
        error,
      );

      results.push({
        leagueId: prepared.leagueId,
        season: prepared.season,
        status: "failed",
        error: message,
      });
    }
  }

  log("Outright sync complete", {
    season,
    fetched: preparedGroups.length,
    skipped,
    created,
    failed,
  });

  return {
    venueId: BOT_VENUE_ID.toString(),
    chainId: ACTIVE_CHAIN_ID,
    botAddress: address,
    season,
    leagues: preparedGroups.length,
    fetched: preparedGroups.length,
    skipped,
    created,
    failed,
    leagueResults,
    leagueErrors,
    results,
  };
}
