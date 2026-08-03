import type { OddMakiClient } from "@oddmaki-protocol/sdk";

import {
  MATCH_ASSERT_BUFFER_SECONDS,
  MATCH_LIFECYCLE_LIMITS,
  MATCH_STALE_OPEN_SECONDS,
  isMatchLifecycleAssertEnabled,
  isMatchLifecycleEnabled,
  isMatchLifecycleSettleEnabled,
} from "@/config/resolution.config";
import { getVenueId } from "@/config/venue.config";
import { fetchFixtureById } from "@/lib/football/api-football-client";
import {
  classifyFixtureStatus,
  resolveBinaryOutcomeForSubMarket,
  type FixtureScore,
} from "@/lib/football/fixture-lifecycle";
import {
  fixtureIdFromTag,
  isFixtureTag,
} from "@/lib/football/map-fixture-to-market-group";
import { kickoffUnixFromTags } from "@/lib/football/kickoff-display";
import { isOutrightGroup } from "@/lib/markets/marketFilters";
import { parseSubMarketIdentity } from "@/lib/markets/marketDisplay";
import { createBotWalletContext } from "@/lib/oddmaki/server-bot-client";
import { createReadOnlyClient } from "@/lib/admin/fixtures-service";

const LOG_PREFIX = "[cron/match-lifecycle]";
const PAGE_SIZE = 50;

export interface MatchLifecycleSummary {
  scannedGroups: number;
  fixturesChecked: number;
  paused: number;
  asserted: number;
  settled: number;
  reported: number;
  skipped: number;
  errors: string[];
  dryRun: boolean;
}

function logInfo(message: string, extra?: unknown) {
  if (extra !== undefined) {
    console.info(LOG_PREFIX, message, extra);
  } else {
    console.info(LOG_PREFIX, message);
  }
}

function logError(message: string, error: unknown) {
  console.error(LOG_PREFIX, message, error);
}

function extractFixtureId(tags: string[] | undefined): number | null {
  if (!tags?.length) return null;

  for (const tag of tags) {
    if (!isFixtureTag(tag)) continue;

    return fixtureIdFromTag(tag);
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function listCandidateGroups(
  client: OddMakiClient,
  venueId: bigint,
  maxGroups: number,
): Promise<
  Array<{
    groupId: string;
    status: string;
    tags: string[];
    fixtureId: number;
    kickoffUnix: number | null;
  }>
> {
  const out: Array<{
    groupId: string;
    status: string;
    tags: string[];
    fixtureId: number;
    kickoffUnix: number | null;
  }> = [];
  let skip = 0;

  while (out.length < maxGroups) {
    const result = (await client.public.getMarketGroups({
      venueId,
      first: PAGE_SIZE,
      skip,
    })) as {
      marketGroups?: Array<{
        groupId?: string | bigint;
        status?: string;
        tags?: string[];
      }>;
    };

    const batch = result.marketGroups ?? [];

    if (batch.length === 0) break;

    for (const raw of batch) {
      const tags = raw.tags ?? [];

      if (isOutrightGroup(tags)) continue;

      const fixtureId = extractFixtureId(tags);

      if (fixtureId == null) continue;

      const status = raw.status ?? "Active";

      if (status === "Resolved" || status === "Invalid") continue;

      out.push({
        groupId: String(raw.groupId),
        status,
        tags,
        fixtureId,
        kickoffUnix: kickoffUnixFromTags(tags),
      });

      if (out.length >= maxGroups) break;
    }

    if (batch.length < PAGE_SIZE) break;

    skip += PAGE_SIZE;
  }

  return out;
}

async function listGroupChildMarkets(
  client: OddMakiClient,
  groupId: string,
): Promise<
  Array<{
    marketId: string;
    name: string;
    status: string;
    outcomes: string[];
  }>
> {
  const result = (await client.public.getGroupMarkets({
    groupId: BigInt(groupId),
    first: 100,
  })) as {
    markets?: Array<{
      marketId?: string | bigint;
      status?: string;
      outcomes?: string[];
      marketGroupItem?: { marketName?: string };
      question?: string;
    }>;
  };

  return (result.markets ?? []).map((market) => ({
    marketId: String(market.marketId),
    name: market.marketGroupItem?.marketName ?? `Market ${market.marketId}`,
    status: market.status ?? "Active",
    outcomes: market.outcomes ?? ["Yes", "No"],
  }));
}

function scoreFromFixture(row: {
  goals?: { home: number | null; away: number | null };
  score?: {
    fulltime?: { home: number | null; away: number | null };
    penalty?: { home: number | null; away: number | null };
  };
}): FixtureScore | null {
  const ftHome = row.score?.fulltime?.home ?? row.goals?.home;
  const ftAway = row.score?.fulltime?.away ?? row.goals?.away;

  if (
    typeof ftHome === "number" &&
    typeof ftAway === "number" &&
    Number.isFinite(ftHome) &&
    Number.isFinite(ftAway)
  ) {
    return { home: ftHome, away: ftAway };
  }

  return null;
}

async function pauseActiveChildren(params: {
  client: OddMakiClient;
  markets: Array<{ marketId: string; status: string }>;
  remaining: { pauses: number };
  dryRun: boolean;
  errors: string[];
}): Promise<number> {
  let paused = 0;

  for (const market of params.markets) {
    if (params.remaining.pauses <= 0) break;
    if (market.status !== "Active") continue;

    try {
      if (!params.dryRun) {
        await params.client.market.pauseMarket(BigInt(market.marketId));
        await sleep(400);
      }

      paused += 1;
      params.remaining.pauses -= 1;
    } catch (error) {
      // Already paused / not operator / transient — continue.
      const message = error instanceof Error ? error.message : String(error);

      if (!/already|paused/i.test(message)) {
        params.errors.push(`pause ${market.marketId}: ${message.slice(0, 160)}`);
      }
    }
  }

  return paused;
}

async function assertFinishedChildren(params: {
  client: OddMakiClient;
  markets: Array<{
    marketId: string;
    name: string;
    status: string;
    outcomes: string[];
  }>;
  score: FixtureScore;
  remaining: { asserts: number };
  dryRun: boolean;
  errors: string[];
}): Promise<number> {
  let asserted = 0;

  for (const market of params.markets) {
    if (params.remaining.asserts <= 0) break;
    if (market.status === "Resolved" || market.status === "Invalid") continue;

    try {
      const status = await params.client.uma.getMarketStatus(BigInt(market.marketId));

      if (status.isResolved || status.assertion.hasAssertion) continue;

      const identity = parseSubMarketIdentity(market.name);
      const yesLabel = market.outcomes[0] ?? "Yes";
      const noLabel = market.outcomes[1] ?? "No";
      const outcome = resolveBinaryOutcomeForSubMarket({
        marketType: identity?.marketType ?? null,
        outcomeKey: identity?.outcomeKey ?? null,
        score: params.score,
        yesLabel,
        noLabel,
      });

      if (!outcome) continue;

      if (!params.dryRun) {
        await params.client.uma.assertMarketOutcome({
          marketId: BigInt(market.marketId),
          outcome,
          autoApprove: true,
        });
        await sleep(800);
      }

      asserted += 1;
      params.remaining.asserts -= 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      params.errors.push(`assert ${market.marketId}: ${message.slice(0, 160)}`);
    }
  }

  return asserted;
}

async function settleAndReportReady(params: {
  client: OddMakiClient;
  marketIds: string[];
  remaining: { settles: number };
  dryRun: boolean;
  errors: string[];
}): Promise<{ settled: number; reported: number }> {
  let settled = 0;
  let reported = 0;

  for (const marketId of params.marketIds) {
    if (params.remaining.settles <= 0) break;

    try {
      const status = await params.client.uma.getMarketStatus(BigInt(marketId));

      if (status.isResolved) continue;

      if (
        status.assertion.hasAssertion &&
        !status.assertion.settled &&
        status.assertion.assertionId
      ) {
        const details = await params.client.uma.getAssertionDetails(
          status.assertion.assertionId,
        );

        if (details.canSettle && !details.isDisputed) {
          if (!params.dryRun) {
            await params.client.uma.settleAssertion(status.assertion.assertionId);
            await sleep(600);
          }

          settled += 1;
          params.remaining.settles -= 1;
        }
      }

      const refreshed = await params.client.uma.getMarketStatus(BigInt(marketId));

      if (refreshed.canReportResolution && refreshed.assertion.outcome) {
        if (!params.dryRun) {
          await params.client.uma.reportResolution({
            marketId: BigInt(marketId),
            outcome: refreshed.assertion.outcome,
          });
          await sleep(600);
        }

        reported += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      params.errors.push(`settle ${marketId}: ${message.slice(0, 160)}`);
    }
  }

  return { settled, reported };
}

/**
 * Close finished fixtures (pause), assert from API-Football scores after a
 * buffer, then settle/report undisputed assertions. Cheap, capped, operator-bot only.
 */
export async function runMatchLifecycleJob(options?: {
  dryRun?: boolean;
}): Promise<MatchLifecycleSummary> {
  const dryRun = Boolean(options?.dryRun);
  const summary: MatchLifecycleSummary = {
    scannedGroups: 0,
    fixturesChecked: 0,
    paused: 0,
    asserted: 0,
    settled: 0,
    reported: 0,
    skipped: 0,
    errors: [],
    dryRun,
  };

  if (!isMatchLifecycleEnabled()) {
    summary.skipped += 1;
    logInfo("Disabled via MATCH_LIFECYCLE_ENABLED");

    return summary;
  }

  const venueId = getVenueId();

  if (venueId === undefined) {
    throw new Error("NEXT_PUBLIC_VENUE_ID is not set");
  }

  const readClient = createReadOnlyClient();
  const groups = await listCandidateGroups(
    readClient,
    venueId,
    MATCH_LIFECYCLE_LIMITS.maxGroupsScanned,
  );

  summary.scannedGroups = groups.length;
  logInfo(`Candidate groups: ${groups.length}`);

  const bot =
    dryRun ? null : createBotWalletContext();
  const writeClient = bot?.client ?? readClient;

  const remaining = {
    pauses: MATCH_LIFECYCLE_LIMITS.maxPauses,
    asserts: MATCH_LIFECYCLE_LIMITS.maxAsserts,
    settles: MATCH_LIFECYCLE_LIMITS.maxSettles,
  };

  const settleCandidates = new Set<string>();
  const nowUnix = Math.floor(Date.now() / 1000);
  const fixtureCache = new Map<
    number,
    Awaited<ReturnType<typeof fetchFixtureById>>
  >();

  for (const group of groups) {
    let row = fixtureCache.get(group.fixtureId);

    if (row === undefined) {
      try {
        row = await fetchFixtureById(group.fixtureId);
        fixtureCache.set(group.fixtureId, row);
        summary.fixturesChecked += 1;
        await sleep(120);
      } catch (error) {
        logError(`fixture ${group.fixtureId}`, error);
        summary.errors.push(
          `fixture ${group.fixtureId}: ${
            error instanceof Error ? error.message.slice(0, 120) : "fetch failed"
          }`,
        );
        continue;
      }
    }

    if (!row) {
      summary.skipped += 1;
      continue;
    }

    const kind = classifyFixtureStatus(row.fixture.status?.short);
    const kickoff =
      group.kickoffUnix ??
      (typeof row.fixture.timestamp === "number" ? row.fixture.timestamp : null);

    const children = await listGroupChildMarkets(writeClient, group.groupId);
    const activeChildren = children.filter((child) => child.status === "Active");

    for (const child of children) {
      settleCandidates.add(child.marketId);
    }

    const shouldCloseTrading =
      kind === "finished" ||
      kind === "void" ||
      (kickoff != null &&
        nowUnix - kickoff >= MATCH_STALE_OPEN_SECONDS &&
        kind !== "live");

    if (shouldCloseTrading && activeChildren.length > 0) {
      summary.paused += await pauseActiveChildren({
        client: writeClient,
        markets: activeChildren,
        remaining,
        dryRun,
        errors: summary.errors,
      });
    }

    if (
      kind === "finished" &&
      isMatchLifecycleAssertEnabled() &&
      remaining.asserts > 0
    ) {
      // Wait until FT buffer after a conservative full-time window from kickoff.
      const assertGate =
        kickoff != null &&
        nowUnix >= kickoff + 105 * 60 + MATCH_ASSERT_BUFFER_SECONDS;

      if (assertGate) {
        const score = scoreFromFixture(row);

        if (score) {
          summary.asserted += await assertFinishedChildren({
            client: writeClient,
            markets: children,
            score,
            remaining,
            dryRun,
            errors: summary.errors,
          });
        } else {
          summary.skipped += 1;
        }
      }
    }
  }

  if (isMatchLifecycleSettleEnabled() && remaining.settles > 0) {
    const result = await settleAndReportReady({
      client: writeClient,
      marketIds: Array.from(settleCandidates),
      remaining,
      dryRun,
      errors: summary.errors,
    });

    summary.settled += result.settled;
    summary.reported += result.reported;
  }

  logInfo("Done", summary);

  return summary;
}

export function logMatchLifecycleError(message: string, error: unknown) {
  logError(message, error);
}
