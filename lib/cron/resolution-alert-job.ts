import {
  MarketsFacetABI,
  buildSubgraphGatewayUrl,
} from "@oddmaki-protocol/sdk";
import { decodeEventLog, parseAbiItem, type Address, type Log } from "viem";
import { mnemonicToAccount } from "viem/accounts";

import { markAssertionNotified } from "@/lib/cron/resolution-alert-state";
import { sendResolutionAlertEmail } from "@/lib/email/send-resolution-alert";
import { getVenueId } from "@/config/venue.config";
import { BRAND_CONFIG } from "@/config/brand.config";
import { ACTIVE_CHAIN } from "@/lib/oddmaki/chain";
import { DIAMOND_ADDRESS } from "@/lib/oddmaki/constants";
import { createReadOnlyClient } from "@/lib/admin/fixtures-service";
import { getPublicClient } from "@/lib/rpc/baseClient";

const LOG_PREFIX = "[cron/resolution-alerts]";
const LOOKBACK_BLOCKS = BigInt(900);

const ASSERTION_CREATED = parseAbiItem(
  "event AssertionCreated(bytes32 indexed assertionId, bytes32 indexed questionId, string outcome, address asserter)",
);

interface MarketByQuestionRow {
  marketId: string;
  question: string;
}

async function fetchMarketByQuestionId(
  questionId: string,
  subgraphUrl: string,
): Promise<MarketByQuestionRow | null> {
  const query = `
    query MarketByQuestion($questionId: String!) {
      markets(first: 1, where: { questionId: $questionId }) {
        marketId
        question
      }
    }
  `;

  const response = await fetch(subgraphUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { questionId: questionId.toLowerCase() },
    }),
  });

  if (!response.ok) return null;

  const json = (await response.json()) as {
    data?: { markets?: MarketByQuestionRow[] };
    errors?: unknown;
  };

  if (json.errors) return null;

  return json.data?.markets?.[0] ?? null;
}

function decodeAssertionLog(log: Log): {
  assertionId: string;
  questionId: string;
  outcome: string;
  asserter: string;
} | null {
  if (log.topics.length < 3) return null;

  try {
    const decoded = decodeEventLog({
      abi: [ASSERTION_CREATED],
      eventName: "AssertionCreated",
      topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
      data: log.data,
    });

    const args = decoded.args as {
      assertionId: `0x${string}`;
      questionId: `0x${string}`;
      outcome: string;
      asserter: Address;
    };

    return {
      assertionId: args.assertionId,
      questionId: args.questionId,
      outcome: args.outcome,
      asserter: args.asserter,
    };
  } catch {
    return null;
  }
}

function resolveOperatorAddress(): string | undefined {
  const explicit = process.env.RESOLUTION_OPERATOR_ADDRESS?.trim();

  if (explicit) return explicit.toLowerCase();

  const mnemonic = process.env.OPERATOR_BOT_MNEMONIC?.trim();

  if (!mnemonic) return undefined;

  return mnemonicToAccount(mnemonic).address.toLowerCase();
}

export interface ResolutionAlertSummary {
  venueId: string;
  scannedBlocks: string;
  assertionsFound: number;
  emailsSent: number;
  skippedDuplicate: number;
  foreignAssertions: number;
  errors: string[];
}

export async function runResolutionAlertJob(): Promise<ResolutionAlertSummary> {
  const venueId = getVenueId();

  if (venueId === undefined) {
    throw new Error("NEXT_PUBLIC_VENUE_ID is not set");
  }

  const graphApiKey =
    process.env.GRAPH_API_KEY ?? process.env.NEXT_PUBLIC_GRAPH_API_KEY;
  const subgraphUrl = graphApiKey
    ? buildSubgraphGatewayUrl(ACTIVE_CHAIN.id, graphApiKey)
    : null;

  if (!subgraphUrl) {
    throw new Error("GRAPH_API_KEY or NEXT_PUBLIC_GRAPH_API_KEY is required");
  }

  const publicClient = getPublicClient({ bot: true });
  const client = createReadOnlyClient();
  const oracleAddress = await client.uma.getUmaOracleAddress();
  const latestBlock = await publicClient.getBlockNumber();
  const fromBlock =
    latestBlock > LOOKBACK_BLOCKS ? latestBlock - LOOKBACK_BLOCKS : BigInt(0);

  const logs = await publicClient.getLogs({
    address: oracleAddress,
    event: ASSERTION_CREATED,
    fromBlock,
    toBlock: latestBlock,
  });

  const operator = resolveOperatorAddress();
  const siteOrigin = `https://${BRAND_CONFIG.domain.replace(/^https?:\/\//, "")}`;

  const summary: ResolutionAlertSummary = {
    venueId: venueId.toString(),
    scannedBlocks: `${fromBlock}-${latestBlock}`,
    assertionsFound: logs.length,
    emailsSent: 0,
    skippedDuplicate: 0,
    foreignAssertions: 0,
    errors: [],
  };

  for (const log of logs) {
    const decoded = decodeAssertionLog(log);

    if (!decoded) continue;

    const isNew = await markAssertionNotified(decoded.assertionId);

    if (!isNew) {
      summary.skippedDuplicate += 1;
      continue;
    }

    try {
      const market = await fetchMarketByQuestionId(
        decoded.questionId,
        subgraphUrl,
      );

      if (!market) {
        summary.errors.push(`No market for question ${decoded.questionId}`);
        continue;
      }

      const registry = (await publicClient.readContract({
        address: DIAMOND_ADDRESS,
        abi: MarketsFacetABI,
        functionName: "getMarketRegistryData",
        args: [BigInt(market.marketId)],
      })) as { venueId?: bigint };

      if (registry.venueId !== undefined && registry.venueId !== venueId) {
        continue;
      }

      const isForeignAsserter =
        !!operator && decoded.asserter.toLowerCase() !== operator;

      if (isForeignAsserter) {
        summary.foreignAssertions += 1;
      }

      await sendResolutionAlertEmail({
        assertionId: decoded.assertionId,
        marketId: market.marketId,
        marketQuestion: market.question,
        proposedOutcome: decoded.outcome,
        asserter: decoded.asserter,
        operatorAddress: operator,
        isForeignAsserter,
        matchUrl: `${siteOrigin}/market/${market.marketId}`,
      });

      summary.emailsSent += 1;
    } catch (error) {
      summary.errors.push(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  console.log(LOG_PREFIX, summary);

  return summary;
}

export function logResolutionAlertError(message: string, error: unknown): void {
  console.error(
    LOG_PREFIX,
    message,
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
}
