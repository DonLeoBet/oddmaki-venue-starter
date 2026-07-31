import type {
  ApiFootballFixtureRow,
  PreparedMatchMarketGroup,
} from "@/lib/football/types";

import {
  buildSubgraphGatewayUrl,
  createOddMakiClient,
  type OddMakiClient,
} from "@oddmaki-protocol/sdk";

import { BOT_VENUE_ID, fixtureTag } from "@/lib/football/constants";
import { fetchUpcomingFixtures } from "@/lib/football/fetch-upcoming-fixtures";
import { getFixtureMinKickoffDateYmd } from "@/lib/football/fixture-window";
import { mapFixtureToMarketGroup } from "@/lib/football/map-fixture-to-market-group";
import { ACTIVE_CHAIN, ACTIVE_CHAIN_ID } from "@/lib/oddmaki/chain";
import { createResilientTransport } from "@/lib/rpc/baseClient";
import {
  createMatchMarketGroupOnChain,
  loadExistingFixtureTags,
} from "@/lib/oddmaki/match-market-bot";
import { createBotWalletContext } from "@/lib/oddmaki/server-bot-client";

export interface AdminFixtureRow {
  fixtureId: number;
  home: string;
  away: string;
  leagueName: string;
  leagueId: number;
  kickoffIso: string;
  status: string;
  prepared: PreparedMatchMarketGroup;
  alreadyExists: boolean;
}

export type AdminCreateResult =
  | { fixtureId: number; status: "dry_run"; message: string }
  | { fixtureId: number; status: "skipped"; reason: string }
  | {
      fixtureId: number;
      status: "created";
      groupId: string;
      txHashes: string[];
    }
  | { fixtureId: number; status: "failed"; error: string };

export function createReadOnlyClient(): OddMakiClient {
  const graphApiKey =
    process.env.GRAPH_API_KEY ?? process.env.NEXT_PUBLIC_GRAPH_API_KEY;

  return createOddMakiClient({
    chain: ACTIVE_CHAIN,
    transport: createResilientTransport({ bot: true }),
    subgraphEndpoint: graphApiKey
      ? buildSubgraphGatewayUrl(ACTIVE_CHAIN.id, graphApiKey)
      : undefined,
  });
}

export async function listAdminFixtures(options: {
  page?: number;
  leagueId?: number;
} = {}): Promise<{
  venueId: string;
  chainId: number;
  fetchWindow: { from: string; to: string; nextPerLeague: number };
  fixtures: AdminFixtureRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  warning?: string;
}> {
  const pageSize = 20;
  const page = Math.max(1, options.page ?? 1);
  const nextPerLeague = 5;
  const fromDate = getFixtureMinKickoffDateYmd();
  const toDate = new Date(`${fromDate}T00:00:00.000Z`);

  toDate.setUTCDate(toDate.getUTCDate() + 30);

  const emptyPagination = {
    page,
    pageSize,
    total: 0,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };

  const baseResponse = {
    venueId: BOT_VENUE_ID.toString(),
    chainId: ACTIVE_CHAIN_ID,
    fetchWindow: {
      from: fromDate,
      to: toDate.toISOString().slice(0, 10),
      nextPerLeague,
    },
  };

  let rows: ApiFootballFixtureRow[] = [];
  let existingTags = new Set<string>();
  const warnings: string[] = [];

  try {
    rows = await fetchUpcomingFixtures({
      perLeague: nextPerLeague,
      leagueId: options.leagueId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch fixtures";

    console.error("[listAdminFixtures] fetchUpcomingFixtures failed:", error);
    warnings.push(message);

    return {
      ...baseResponse,
      fixtures: [],
      pagination: emptyPagination,
      warning: warnings.join(" | "),
    };
  }

  try {
    existingTags = await loadExistingFixtureTags(
      createReadOnlyClient(),
      BOT_VENUE_ID,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load fixture tags";

    console.error("[listAdminFixtures] loadExistingFixtureTags failed:", error);
    warnings.push(message);
  }

  let allFixtures = rows.map((row) => toAdminFixtureRow(row, existingTags));

  if (options.leagueId != null && Number.isFinite(options.leagueId)) {
    allFixtures = allFixtures.filter((f) => f.leagueId === options.leagueId);
  }

  const total = allFixtures.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const fixtures = allFixtures.slice(start, start + pageSize);

  if (total === 0 && rows.length === 0) {
    warnings.push(
      options.leagueId ?
        `No upcoming fixtures returned for league ${options.leagueId}`
      : "No upcoming fixtures returned from API-Football",
    );
  }

  return {
    ...baseResponse,
    fixtures,
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasPrevious: safePage > 1,
      hasNext: safePage < totalPages,
    },
    ...(warnings.length > 0 ? { warning: warnings.join(" | ") } : {}),
  };
}

function toAdminFixtureRow(
  row: ApiFootballFixtureRow,
  existingTags: Set<string>,
): AdminFixtureRow {
  const prepared = mapFixtureToMarketGroup(row);

  return {
    fixtureId: row.fixture.id,
    home: row.teams.home.name,
    away: row.teams.away.name,
    leagueName: row.league.name,
    leagueId: row.league.id,
    kickoffIso: row.fixture.date,
    status: row.fixture.status.short,
    prepared,
    alreadyExists: existingTags.has(fixtureTag(row.fixture.id)),
  };
}

export async function findFixtureRow(
  fixtureId: number,
): Promise<ApiFootballFixtureRow | null> {
  const rows = await fetchUpcomingFixtures({ perLeague: 30 });

  return rows.find((r) => r.fixture.id === fixtureId) ?? null;
}

export async function createFixtureMarket(options: {
  fixtureId: number;
  dryRun: boolean;
}): Promise<{
  dryRun: boolean;
  prepared: PreparedMatchMarketGroup;
  result: AdminCreateResult;
}> {
  const row = await findFixtureRow(options.fixtureId);

  if (!row) {
    throw new Error(`Fixture ${options.fixtureId} not found in upcoming feed`);
  }

  const prepared = mapFixtureToMarketGroup(row);
  const tag = fixtureTag(prepared.fixtureId);
  const existingTags = await loadExistingFixtureTags(
    createReadOnlyClient(),
    BOT_VENUE_ID,
  );

  if (existingTags.has(tag)) {
    return {
      dryRun: options.dryRun,
      prepared,
      result: {
        fixtureId: prepared.fixtureId,
        status: "skipped",
        reason: `Market already exists (${tag})`,
      },
    };
  }

  if (options.dryRun) {
    return {
      dryRun: true,
      prepared,
      result: {
        fixtureId: prepared.fixtureId,
        status: "dry_run",
        message:
          "Would create market group on-chain (dry-run — no transaction sent)",
      },
    };
  }

  const { client, publicClient, address } = createBotWalletContext();
  const onChain = await createMatchMarketGroupOnChain(
    client,
    publicClient,
    BOT_VENUE_ID,
    address,
    prepared,
  );

  if (onChain.status === "created") {
    return {
      dryRun: false,
      prepared,
      result: {
        fixtureId: onChain.fixtureId,
        status: "created",
        groupId: onChain.groupId,
        txHashes: onChain.txHashes,
      },
    };
  }

  return {
    dryRun: false,
    prepared,
    result: {
      fixtureId: onChain.fixtureId,
      status: "failed",
      error: onChain.error,
    },
  };
}
