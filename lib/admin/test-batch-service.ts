import type { PreparedMatchMarketGroup } from "@/lib/football/types";

import { MAX_TAGS } from "@/config/tags.config";
import {
  decodeFixtureMeta,
  encodeFixtureMeta,
} from "@/lib/football/fixture-metadata";
import { mapFixtureToMarketGroup } from "@/lib/football/map-fixture-to-market-group";
import type { ApiFootballFixtureRow } from "@/lib/football/types";
import {
  TEST_BATCH_ID,
  TEST_BATCH_TAG,
  selectTestFixtures,
  type SelectedTestFixture,
  type SelectTestFixturesResult,
} from "@/lib/football/select-test-fixtures";
import { BOT_VENUE_ID, fixtureTag } from "@/lib/football/constants";
import { ACTIVE_CHAIN_ID } from "@/lib/oddmaki/chain";
import {
  createMatchMarketGroupOnChain,
  loadExistingFixtureTags,
} from "@/lib/oddmaki/match-market-bot";
import { createBotWalletContext } from "@/lib/oddmaki/server-bot-client";
import { maybeDelayImportBatch } from "@/lib/rpc/concurrency";

import { createReadOnlyClient } from "./fixtures-service";

export interface TestBatchMarketOutcomePreview {
  name: string;
  outcomeKey: string;
  category: string;
  question: string;
  description: string;
}

export interface TestBatchMarketPreview {
  fixtureId: number;
  leagueId: number;
  leagueName: string;
  leagueSlug: string;
  home: string;
  away: string;
  kickoffIso: string;
  kickoffUnix: number;
  alreadyExists: boolean;
  batch: typeof TEST_BATCH_ID;
  market: {
    title: string;
    question: string;
    description: string;
    tags: string[];
    tickSize: string;
    liveness: number;
    additionalReward: number;
    activateImmediately: boolean;
    oracle: "UMA";
    /** Expected resolution anchor — official full-time result after kickoff. */
    resolutionTimeIso: string;
    outcomes: TestBatchMarketOutcomePreview[];
  };
}

export interface TestBatchDryRunResult {
  ok: true;
  dryRun: true;
  venueId: string;
  chainId: number;
  batch: typeof TEST_BATCH_ID;
  selection: SelectTestFixturesResult;
  markets: TestBatchMarketPreview[];
  summary: {
    wouldCreate: number;
    alreadyOnChain: number;
    skippedLeagues: number;
  };
}

export type TestBatchCreateItemResult =
  | {
      fixtureId: number;
      leagueName: string;
      home: string;
      away: string;
      status: "created";
      groupId: string;
      txHashes: string[];
    }
  | {
      fixtureId: number;
      leagueName: string;
      home: string;
      away: string;
      status: "skipped";
      reason: string;
    }
  | {
      fixtureId: number;
      leagueName: string;
      home: string;
      away: string;
      status: "failed";
      error: string;
    };

export interface TestBatchCreateResult {
  ok: true;
  dryRun: false;
  venueId: string;
  chainId: number;
  batch: typeof TEST_BATCH_ID;
  selection: SelectTestFixturesResult;
  results: TestBatchCreateItemResult[];
  summary: {
    created: number;
    skipped: number;
    failed: number;
  };
}

/** Apply test-batch tag + metadata without changing market structure. */
export function applyTestBatchMetadata(
  prepared: PreparedMatchMarketGroup,
  batchId: string = TEST_BATCH_ID,
): PreparedMatchMarketGroup {
  const batchTag = `batch-${batchId}`;
  const tags = prepared.tags.map((tag) =>
    tag === "match-markets" ? batchTag : tag,
  );

  if (!tags.includes(batchTag) && tags.length < MAX_TAGS) {
    tags.push(batchTag);
  } else if (!tags.includes(batchTag) && tags.length >= MAX_TAGS) {
    tags[tags.length - 1] = batchTag;
  }

  const meta = decodeFixtureMeta(prepared.description);
  let description = prepared.description;

  if (meta) {
    const prose = prepared.description.slice(
      0,
      prepared.description.indexOf("\n<!--fixture-meta:"),
    );

    description = prose + encodeFixtureMeta({ ...meta, batch: batchId });
  }

  return {
    ...prepared,
    tags: tags.slice(0, MAX_TAGS),
    description,
  };
}

function prepareTestBatchMarket(row: ApiFootballFixtureRow): PreparedMatchMarketGroup {
  return applyTestBatchMetadata(mapFixtureToMarketGroup(row));
}

function toMarketPreview(
  item: SelectedTestFixture,
  alreadyExists: boolean,
): TestBatchMarketPreview {
  const prepared = prepareTestBatchMarket(item.row);

  return {
    fixtureId: item.fixtureId,
    leagueId: item.leagueId,
    leagueName: item.leagueName,
    leagueSlug: item.leagueSlug,
    home: item.home,
    away: item.away,
    kickoffIso: item.kickoffIso,
    kickoffUnix: item.kickoffUnix,
    alreadyExists,
    batch: TEST_BATCH_ID,
    market: {
      title: prepared.title,
      question: prepared.title,
      description: prepared.description,
      tags: prepared.tags,
      tickSize: prepared.tickSize,
      liveness: prepared.liveness,
      additionalReward: prepared.additionalReward,
      activateImmediately: prepared.activateImmediately,
      oracle: "UMA",
      resolutionTimeIso: item.kickoffIso,
      outcomes: prepared.outcomes.map((o) => ({
        name: o.name,
        outcomeKey: o.outcomeKey,
        category: o.category,
        question: o.question,
        description: o.description,
      })),
    },
  };
}

export async function runTestBatchDryRun(): Promise<TestBatchDryRunResult> {
  const selection = await selectTestFixtures();
  const existingTags = await loadExistingFixtureTags(
    createReadOnlyClient(),
    BOT_VENUE_ID,
  );

  const markets = selection.selected.map((item) =>
    toMarketPreview(item, existingTags.has(fixtureTag(item.fixtureId))),
  );

  const alreadyOnChain = markets.filter((m) => m.alreadyExists).length;

  return {
    ok: true,
    dryRun: true,
    venueId: BOT_VENUE_ID.toString(),
    chainId: ACTIVE_CHAIN_ID,
    batch: TEST_BATCH_ID,
    selection,
    markets,
    summary: {
      wouldCreate: markets.length - alreadyOnChain,
      alreadyOnChain,
      skippedLeagues: selection.skippedLeagues.length,
    },
  };
}

export async function runTestBatchCreate(): Promise<TestBatchCreateResult> {
  const selection = await selectTestFixtures();
  const existingTags = await loadExistingFixtureTags(
    createReadOnlyClient(),
    BOT_VENUE_ID,
  );

  const { client, publicClient, address } = createBotWalletContext();
  const results: TestBatchCreateItemResult[] = [];

  for (let index = 0; index < selection.selected.length; index++) {
    const item = selection.selected[index];

    await maybeDelayImportBatch(index);

    const tag = fixtureTag(item.fixtureId);
    const base = {
      fixtureId: item.fixtureId,
      leagueName: item.leagueName,
      home: item.home,
      away: item.away,
    };

    if (existingTags.has(tag)) {
      results.push({
        ...base,
        status: "skipped",
        reason: `Market already exists (${tag})`,
      });
      continue;
    }

    const prepared = prepareTestBatchMarket(item.row);
    const onChain = await createMatchMarketGroupOnChain(
      client,
      publicClient,
      BOT_VENUE_ID,
      address,
      prepared,
    );

    if (onChain.status === "created") {
      existingTags.add(tag);
      results.push({
        ...base,
        status: "created",
        groupId: onChain.groupId,
        txHashes: onChain.txHashes,
      });
    } else {
      results.push({
        ...base,
        status: "failed",
        error: onChain.error,
      });
    }
  }

  return {
    ok: true,
    dryRun: false,
    venueId: BOT_VENUE_ID.toString(),
    chainId: ACTIVE_CHAIN_ID,
    batch: TEST_BATCH_ID,
    selection,
    results,
    summary: {
      created: results.filter((r) => r.status === "created").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: results.filter((r) => r.status === "failed").length,
    },
  };
}
