import type { OddMakiClient } from "@oddmaki-protocol/sdk";
import type { PreparedMatchMarketGroup, MatchCreationResult } from "@/lib/football/types";
import { fixtureTag } from "@/lib/football/constants";
import {
  MarketGroupFacetABI,
  VenueFacetABI,
} from "@oddmaki-protocol/sdk";
import { decodeEventLog, parseEther, parseUnits, type PublicClient } from "viem";

import {
  DIAMOND_ADDRESS,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/oddmaki/constants";

const WAIT_MS = 2000;

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

/**
 * Load all fixture-* tags already present on venue markets/groups (subgraph).
 */
export async function loadExistingFixtureTags(
  client: OddMakiClient,
  venueId: bigint,
): Promise<Set<string>> {
  const tags = new Set<string>();
  const pageSize = 100;

  // Market groups (primary path for match markets)
  for (let skip = 0; ; skip += pageSize) {
    const result = (await client.public.getMarketGroups({
      venueId,
      first: pageSize,
      skip,
    })) as { marketGroups?: { tags?: string[]; status?: string }[] };

    const groups = result.marketGroups ?? [];

    if (groups.length === 0) break;

    for (const group of groups) {
      for (const tag of group.tags ?? []) {
        if (tag.startsWith("fixture-")) tags.add(tag);
      }
    }

    if (groups.length < pageSize) break;
  }

  // Standalone markets (defensive — skip duplicates if any were created individually)
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
        if (tag.startsWith("fixture-")) tags.add(tag);
      }
    }

    if (markets.length < pageSize) break;
  }

  return tags;
}

async function ensureUsdcApproval(
  client: OddMakiClient,
  publicClient: PublicClient,
  signer: Address,
  venueId: bigint,
  additionalReward: bigint,
): Promise<`0x${string}` | null> {
  const venue = (await publicClient.readContract({
    address: DIAMOND_ADDRESS,
    abi: VenueFacetABI,
    functionName: "getVenue",
    args: [venueId],
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

/**
 * Create and activate an OddMaki market group for a prepared football fixture.
 */
export async function createMatchMarketGroupOnChain(
  client: OddMakiClient,
  publicClient: PublicClient,
  venueId: bigint,
  signer: Address,
  prepared: PreparedMatchMarketGroup,
): Promise<MatchCreationResult> {
  const tag = fixtureTag(prepared.fixtureId);
  const txHashes: string[] = [];

  try {
    const canCreate = await client.venue.canCreateMarket(signer, venueId);

    if (!canCreate) {
      return {
        fixtureId: prepared.fixtureId,
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
        marketQuestion: outcome.question.trim(),
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
      fixtureId: prepared.fixtureId,
      status: "created",
      groupId: groupId.toString(),
      txHashes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      fixtureId: prepared.fixtureId,
      status: "failed",
      error: `[${tag}] ${message}`,
    };
  }
}
