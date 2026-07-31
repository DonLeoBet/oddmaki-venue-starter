import type { MatchCreationResult } from "@/lib/football/types";

import {
  BOT_VENUE_ID,
  fixtureTag,
  FOOTBALL_LEAGUES,
} from "@/lib/football/constants";
import {
  CRON_FIXTURE_DAYS_AHEAD,
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
  fetched: number;
  skipped: number;
  created: number;
  failed: number;
  results: MatchCreationResult[];
}

/**
 * Core cron job: fetch upcoming fixtures for all configured leagues and create
 * OddMaki market groups on venue 6 via the operator bot wallet (mnemonic).
 */
export async function runFetchMatchesJob(): Promise<FetchMatchesSummary> {
  const daysAhead = Number(
    process.env.CRON_FIXTURE_DAYS_AHEAD ?? CRON_FIXTURE_DAYS_AHEAD,
  );
  const perLeague = Number(
    process.env.CRON_FIXTURE_PER_LEAGUE ?? 20,
  );
  const leagueCount = Object.keys(FOOTBALL_LEAGUES).length;

  log("Starting football fixture sync", {
    venueId: BOT_VENUE_ID.toString(),
    chainId: ACTIVE_CHAIN_ID,
    leagues: leagueCount,
    daysAhead,
  });

  const { client, publicClient, address } = createBotWalletContext();

  log("Bot wallet initialized", { address });

  const fixtures = await fetchUpcomingFixtures({
    perLeague,
    maxDaysAhead: daysAhead,
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
    created,
    failed,
  });

  return {
    venueId: BOT_VENUE_ID.toString(),
    chainId: ACTIVE_CHAIN_ID,
    botAddress: address,
    leagues: leagueCount,
    daysAhead,
    fetched: fixtures.length,
    skipped,
    created,
    failed,
    results,
  };
}
