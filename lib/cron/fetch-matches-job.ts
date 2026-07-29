import type { MatchCreationResult } from "@/lib/football/types";
import { BOT_VENUE_ID, fixtureTag } from "@/lib/football/constants";
import { fetchUpcomingFixtures } from "@/lib/football/fetch-upcoming-fixtures";
import { mapFixtureToMarketGroup } from "@/lib/football/map-fixture-to-market-group";
import { ACTIVE_CHAIN_ID } from "@/lib/oddmaki/chain";
import {
  createMatchMarketGroupOnChain,
  loadExistingFixtureTags,
} from "@/lib/oddmaki/match-market-bot";
import { createBotWalletContext } from "@/lib/oddmaki/server-bot-client";

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
    error instanceof Error ? error.stack ?? error.message : error,
  );
}

export interface FetchMatchesSummary {
  venueId: string;
  chainId: number;
  botAddress: string;
  fetched: number;
  skipped: number;
  created: number;
  failed: number;
  results: MatchCreationResult[];
}

/**
 * Core cron job: fetch API-Football fixtures and create OddMaki market groups
 * on venue 6 via the operator bot wallet.
 */
export async function runFetchMatchesJob(): Promise<FetchMatchesSummary> {
  log("Starting football fixture sync", {
    venueId: BOT_VENUE_ID.toString(),
    chainId: ACTIVE_CHAIN_ID,
  });

  const { client, publicClient, address } = createBotWalletContext();

  log("Bot wallet initialized", { address });

  const fixtures = await fetchUpcomingFixtures({ perLeague: 15 });

  log("Fetched upcoming fixtures from API-Football", { count: fixtures.length });

  const existingTags = await loadExistingFixtureTags(client, BOT_VENUE_ID);

  log("Loaded existing fixture tags from subgraph", {
    count: existingTags.size,
  });

  const results: MatchCreationResult[] = [];
  let skipped = 0;
  let created = 0;
  let failed = 0;

  for (const row of fixtures) {
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

  log("Fixture sync complete", { fetched: fixtures.length, skipped, created, failed });

  return {
    venueId: BOT_VENUE_ID.toString(),
    chainId: ACTIVE_CHAIN_ID,
    botAddress: address,
    fetched: fixtures.length,
    skipped,
    created,
    failed,
    results,
  };
}
