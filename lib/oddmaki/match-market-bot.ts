import type { OddMakiClient } from "@oddmaki-protocol/sdk";
import type {
  OutrightCreationResult,
  PreparedMatchMarketGroup,
  PreparedOutrightMarketGroup,
} from "@/lib/football/types";

import {
  MarketGroupFacetABI,
  VenueFacetABI,
  formatAncillaryData,
} from "@oddmaki-protocol/sdk";
import {
  decodeEventLog,
  parseEther,
  parseUnits,
  type PublicClient,
} from "viem";

import { fixtureTag, getOutrightIdempotencyTag } from "@/lib/football/constants";
import { isRetiredBeatOnlyMatchGroup } from "@/lib/markets/marketFilters";
import {
  DIAMOND_ADDRESS,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/oddmaki/constants";
import { cachedReadContract } from "@/lib/rpc/baseClient";
import { withRpcRetry } from "@/lib/rpc/retry";

const WAIT_MS = 2000;
const BOT_RPC_MAX_ATTEMPTS = 8;
const BOT_RPC_BASE_DELAY_MS = 500;

interface PreparedMarketGroupPayload {
  title: string;
  description: string;
  tags: string[];
  outcomes: Array<{ name: string; question: string; description: string }>;
  tickSize: "0.01";
  additionalReward: number;
  liveness: number;
  activateImmediately: true;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface MarketGroupCreatedArgs {
  groupId: bigint;
}

function decodeGroupId(
  logs: { topics: readonly `0x${string}`[]; data: `0x${string}` }[],
): bigint | null {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: MarketGroupFacetABI,
        eventName: "MarketGroupCreated",
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
        data: log.data,
      });
      const args = decoded.args as unknown as MarketGroupCreatedArgs;

      if (args?.groupId !== undefined) return BigInt(args.groupId);
    } catch {
      // scan remaining logs
    }
  }

  return null;
}

async function waitForAllowance(
  client: OddMakiClient,
  owner: Address,
  required: bigint,
): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const allowance = (await client.token.getAllowance(
      USDC_ADDRESS,
      owner,
      DIAMOND_ADDRESS,
    )) as bigint;

    if (allowance >= required) return;
    await wait(1500);
  }

  throw new Error("USDC allowance not confirmed after approval transaction");
}

type Address = `0x${string}`;

async function collectAutomationTags(
  client: OddMakiClient,
  venueId: bigint,
  prefix: string,
): Promise<Set<string>> {
  const tags = new Set<string>();
  const pageSize = 100;

  for (let skip = 0; ; skip += pageSize) {
    const result = (await client.public.getMarketGroups({
      venueId,
      first: pageSize,
      skip,
    })) as { marketGroups?: { tags?: string[] }[] };

    const groups = result.marketGroups ?? [];

    if (groups.length === 0) break;

    for (const group of groups) {
      for (const tag of group.tags ?? []) {
        if (tag.startsWith(prefix)) tags.add(tag);
      }
    }

    if (groups.length < pageSize) break;
  }

  for (let skip = 0; ; skip += pageSize) {
    const result = (await client.public.getMarketsWithPricing({
      venueId,
      first: pageSize,
      skip,
      statuses: ["Draft", "Active"],
    })) as { markets?: { tags?: string[] }[] };

    const markets = result.markets ?? [];

    if (markets.length === 0) break;

    for (const market of markets) {
      for (const tag of market.tags ?? []) {
        if (tag.startsWith(prefix)) tags.add(tag);
      }
    }

    if (markets.length < pageSize) break;
  }

  return tags;
}

export async function loadExistingFixtureTags(
  client: OddMakiClient,
  venueId: bigint,
): Promise<Set<string>> {
  const tags = new Set<string>();
  const pageSize = 100;

  for (let skip = 0; ; skip += pageSize) {
    const result = (await client.public.getMarketGroups({
      venueId,
      first: pageSize,
      skip,
    })) as {
      marketGroups?: Array<{
        tags?: string[];
        totalMarkets?: string | number;
        markets?: Array<{ marketName?: string; name?: string }>;
      }>;
    };

    const groups = result.marketGroups ?? [];

    if (groups.length === 0) break;

    for (const group of groups) {
      const groupTags = group.tags ?? [];
      const outcomes = (group.markets ?? []).map((market) => ({
        name: market.marketName ?? market.name ?? "",
      }));
      const isRetiredEredivisieBeat =
        groupTags.includes("match-markets-v2") &&
        groupTags.includes("league-eredivisie") &&
        Number(group.totalMarkets ?? 0) === 2;

      // Retired beat-only groups may be replaced with a fresh 1X2 import.
      if (
        isRetiredEredivisieBeat ||
        isRetiredBeatOnlyMatchGroup(groupTags, outcomes)
      ) {
        continue;
      }

      for (const tag of groupTags) {
        if (tag.startsWith("fixture-")) tags.add(tag);
      }
    }

    if (groups.length < pageSize) break;
  }

  return tags;
}

export async function loadExistingOutrightTags(
  client: OddMakiClient,
  venueId: bigint,
): Promise<Set<string>> {
  return collectAutomationTags(client, venueId, "outright-");
}

async function ensureUsdcApproval(
  client: OddMakiClient,
  publicClient: PublicClient,
  signer: Address,
  venueId: bigint,
  additionalReward: bigint,
): Promise<`0x${string}` | null> {
  const venue = (await cachedReadContract(publicClient, {
    address: DIAMOND_ADDRESS,
    abi: VenueFacetABI,
    functionName: "getVenue",
    args: [venueId],
  }, {
    cacheKey: `venue:${venueId}:fees`,
  })) as { marketCreationFee?: bigint; umaRewardAmount?: bigint };

  const creationFee = BigInt(venue.marketCreationFee ?? 0);
  const baseUmaReward = BigInt(venue.umaRewardAmount ?? 0);
  const totalApproval = creationFee + baseUmaReward + additionalReward;

  if (totalApproval <= BigInt(0)) return null;

  const allowance = (await client.token.getAllowance(
    USDC_ADDRESS,
    signer,
    DIAMOND_ADDRESS,
  )) as bigint;

  if (allowance >= totalApproval) return null;

  const hash = await client.token.approve(
    USDC_ADDRESS,
    DIAMOND_ADDRESS,
    totalApproval,
  );

  await publicClient.waitForTransactionReceipt({ hash });
  await waitForAllowance(client, signer, totalApproval);

  return hash;
}

async function createPreparedMarketGroupOnChain(
  client: OddMakiClient,
  publicClient: PublicClient,
  venueId: bigint,
  signer: Address,
  prepared: PreparedMarketGroupPayload,
  logTag: string,
): Promise<
  | { status: "created"; groupId: string; txHashes: string[] }
  | { status: "failed"; error: string }
> {
  const txHashes: string[] = [];

  try {
    const canCreate = await withRpcRetry(
      () => client.venue.canCreateMarket(signer, venueId),
      {
        label: "canCreateMarket",
        maxAttempts: BOT_RPC_MAX_ATTEMPTS,
        baseDelayMs: BOT_RPC_BASE_DELAY_MS,
      },
    );

    if (!canCreate) {
      return {
        status: "failed",
        error: `Bot wallet ${signer} cannot create markets on venue ${venueId}`,
      };
    }

    const additionalReward = parseUnits(
      prepared.additionalReward.toString(),
      USDC_DECIMALS,
    );

    const approvalHash = await ensureUsdcApproval(
      client,
      publicClient,
      signer,
      venueId,
      additionalReward,
    );

    if (approvalHash) txHashes.push(approvalHash);

    await wait(WAIT_MS);

    const createHash = await client.market.createMarketGroup({
      venueId,
      question: prepared.title,
      description: prepared.description,
      collateralToken: USDC_ADDRESS,
      tickSize: parseEther(prepared.tickSize),
      additionalReward,
      liveness: BigInt(prepared.liveness),
      tags: prepared.tags,
    });

    txHashes.push(createHash);

    const createReceipt = await publicClient.waitForTransactionReceipt({
      hash: createHash,
    });
    const groupId = decodeGroupId(createReceipt.logs);

    if (groupId === null) {
      throw new Error("MarketGroupCreated event not found in transaction logs");
    }

    for (const outcome of prepared.outcomes) {
      await wait(WAIT_MS);
      const addHash = await client.market.addMarketToGroup({
        marketGroupId: groupId,
        marketName: outcome.name.trim(),
        marketQuestion: formatAncillaryData({
          title: outcome.question.trim(),
          description: outcome.description.trim(),
        }),
      });

      txHashes.push(addHash);
      await publicClient.waitForTransactionReceipt({ hash: addHash });
    }

    if (prepared.activateImmediately) {
      await wait(WAIT_MS);
      const activateHash = await client.market.activateMarketGroup({
        marketGroupId: groupId,
      });

      txHashes.push(activateHash);
      await publicClient.waitForTransactionReceipt({ hash: activateHash });
    }

    return {
      status: "created",
      groupId: groupId.toString(),
      txHashes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      status: "failed",
      error: `[${logTag}] ${message}`,
    };
  }
}

export async function createMatchMarketGroupOnChain(
  client: OddMakiClient,
  publicClient: PublicClient,
  venueId: bigint,
  signer: Address,
  prepared: PreparedMatchMarketGroup,
) {
  const tag = fixtureTag(prepared.fixtureId);
  const result = await createPreparedMarketGroupOnChain(
    client,
    publicClient,
    venueId,
    signer,
    prepared,
    tag,
  );

  if (result.status === "created") {
    return {
      fixtureId: prepared.fixtureId,
      status: "created" as const,
      groupId: result.groupId,
      txHashes: result.txHashes,
    };
  }

  return {
    fixtureId: prepared.fixtureId,
    status: "failed" as const,
    error: result.error,
  };
}

export async function createOutrightMarketGroupOnChain(
  client: OddMakiClient,
  publicClient: PublicClient,
  venueId: bigint,
  signer: Address,
  prepared: PreparedOutrightMarketGroup,
): Promise<OutrightCreationResult> {
  const tag = getOutrightIdempotencyTag(prepared.tags);

  if (!tag) {
    return {
      leagueId: prepared.leagueId,
      season: prepared.season,
      status: "failed",
      partIndex: prepared.partIndex,
      error: "Prepared outright group is missing an outright-* idempotency tag",
    };
  }

  const result = await createPreparedMarketGroupOnChain(
    client,
    publicClient,
    venueId,
    signer,
    prepared,
    tag,
  );

  if (result.status === "created") {
    return {
      leagueId: prepared.leagueId,
      season: prepared.season,
      status: "created",
      groupId: result.groupId,
      txHashes: result.txHashes,
      teamCount: prepared.outcomes.length,
      partIndex: prepared.partIndex,
    };
  }

  return {
    leagueId: prepared.leagueId,
    season: prepared.season,
    status: "failed",
    partIndex: prepared.partIndex,
    error: result.error,
  };
}
