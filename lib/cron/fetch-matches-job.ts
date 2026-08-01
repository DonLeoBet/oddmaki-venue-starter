import type { MatchCreationResult } from "@/lib/football/types";

import {
  BOT_VENUE_ID,
  fixtureTag,
  FOOTBALL_LEAGUES,
} from "@/lib/football/constants";
import {
  CRON_FIXTURE_DAYS_AHEAD,
  fetchLeagueFixturesByMaxRound,
  fetchUpcomingFixtures,
} from "@/lib/football/fetch-upcoming-fixtures";
import { mapFixtureToMarketGroup } from "@/lib/football/map-fixture-to-market-group";
import { ACTIVE_CHAIN_ID } from "@/lib/oddmaki/chain";
import {
  createMatchMarketGroupOnChain,
  loadExistingFixtureTags,
} from "@/lib/oddmaki/match-market-bot";
import { createBotWalletContext } from "@/lib/oddmaki/server-bot-client";
import { maybeDelayImportBatch } from "@/lib/rpc/concurrency";

const LOG_PREFIX = "[cron/fetch-matches]";

function log(message: string, extra?: Record<string, unknown>): void {
  if (extra) {
    console.log(LOG_PREFIX, message, extra);
  } else {
    console.log(LOG_PREFIX, message);
  }
}

export function logFetchMatchesError(message: string, error: unknown): void {
  console.error(
    LOG_PREFIX,
    message,
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
}

export interface FetchMatchesSummary {
  venueId: string;
  chainId: number;
  botAddress: string;
  leagues: number;
  daysAhead: number;
  leagueId?: number;
  maxRounds?: number;
  season?: number;
  dryRun?: boolean;
  planned?: number;
  fetched: number;
  skipped: number;
  created: number;
  failed: number;
  results: MatchCreationResult[];
}

export interface RunFetchMatchesJobOptions {
  leagueId?: number;
  maxRounds?: number;
  season?: number;
  dryRun?: boolean;
}

/**
 * Core cron job: fetch upcoming fixtures for all configured leagues and create
 * OddMaki market groups on venue 6 via the operator bot wallet (mnemonic).
 */
export async function runFetchMatchesJob(
  options: RunFetchMatchesJobOptions = {},
): Promise<FetchMatchesSummary> {
  const daysAhead = Number(
    process.env.CRON_FIXTURE_DAYS_AHEAD ?? CRON_FIXTURE_DAYS_AHEAD,
  );
  const perLeague = Number(
    process.env.CRON_FIXTURE_PER_LEAGUE ?? 40,
  );
  const leagueCount =
    options.leagueId != null ? 1 : Object.keys(FOOTBALL_LEAGUES).length;
  const dryRun = options.dryRun ?? false;

  log("Starting football fixture sync", {
    venueId: BOT_VENUE_ID.toString(),
    chainId: ACTIVE_CHAIN_ID,
    leagues: leagueCount,
    daysAhead,
    leagueId: options.leagueId,
    maxRounds: options.maxRounds,
    dryRun,
  });

  const { client, publicClient, address } = createBotWalletContext();

  log("Bot wallet initialized", { address });

  const fixtures =
    options.leagueId != null && options.maxRounds != null ?
      await fetchLeagueFixturesByMaxRound({
        leagueId: options.leagueId,
        season: options.season,
        maxRound: options.maxRounds,
      })
    : await fetchUpcomingFixtures({
        perLeague,
        maxDaysAhead: daysAhead,
        leagueId: options.leagueId,
        season: options.season,
      });

  log("Fetched upcoming fixtures", {
    count: fixtures.length,
    leagues: leagueCount,
    daysAhead,
    perLeague,
  });

  const existingTags = await loadExistingFixtureTags(client, BOT_VENUE_ID);

  log("Loaded existing fixture tags from subgraph", {
    count: existingTags.size,
  });

  const results: MatchCreationResult[] = [];
  let skipped = 0;
  let created = 0;
  let failed = 0;
  let planned = 0;

  for (let index = 0; index < fixtures.length; index++) {
    const row = fixtures[index];

    await maybeDelayImportBatch(index);

    const prepared = mapFixtureToMarketGroup(row);
    const tag = fixtureTag(prepared.fixtureId);

    if (existingTags.has(tag)) {
      log("Skipping duplicate fixture", {
        fixtureId: prepared.fixtureId,
        tag,
        title: prepared.title,
      });
      results.push({
        fixtureId: prepared.fixtureId,
        status: "skipped",
        reason: `Market already exists (${tag})`,
      });
      skipped += 1;
      continue;
    }

    if (dryRun) {
      log("Dry run — would create market group", {
        fixtureId: prepared.fixtureId,
        title: prepared.title,
        tags: prepared.tags,
      });
      results.push({
        fixtureId: prepared.fixtureId,
        status: "skipped",
        reason: "Would create (dry run)",
      });
      planned += 1;
      continue;
    }

    log("Creating market group on-chain", {
      fixtureId: prepared.fixtureId,
      title: prepared.title,
      tags: prepared.tags,
    });

    const result = await createMatchMarketGroupOnChain(
      client,
      publicClient,
      BOT_VENUE_ID,
      address,
      prepared,
    );

    results.push(result);

    if (result.status === "created") {
      existingTags.add(tag);
      created += 1;
      log("Market group created", {
        fixtureId: result.fixtureId,
        groupId: result.groupId,
        txCount: result.txHashes.length,
      });
    } else if (result.status === "failed") {
      failed += 1;
      logFetchMatchesError(
        `Failed to create market for fixture ${result.fixtureId}`,
        result.error,
      );
    }
  }

  log("Fixture sync complete", {
    fetched: fixtures.length,
    skipped,
    planned,
    created,
    failed,
    dryRun,
  });

  return {
    venueId: BOT_VENUE_ID.toString(),
    chainId: ACTIVE_CHAIN_ID,
    botAddress: address,
    leagues: leagueCount,
    daysAhead,
    leagueId: options.leagueId,
    maxRounds: options.maxRounds,
    season: options.season,
    dryRun,
    planned: dryRun ? planned : undefined,
    fetched: fixtures.length,
    skipped,
    created,
    failed,
    results,
  };
}
