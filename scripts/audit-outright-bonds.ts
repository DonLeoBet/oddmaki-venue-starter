/**
 * One-off: audit requiredBond / liveness on venue outright markets + venue oracle params.
 * Usage: npx tsx scripts/audit-outright-bonds.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  MarketsFacetABI,
  VenueFacetABI,
  buildSubgraphGatewayUrl,
  createOddMakiClient,
} from "@oddmaki-protocol/sdk";
import { formatUnits, createPublicClient } from "viem";

import { LEAGUE_BY_ID } from "../config/leagues";
import { TOP_LEAGUES } from "../config/top-leagues";
import { isOutrightGroup, parseOutrightTag } from "../lib/markets/marketFilters";
import { ACTIVE_CHAIN, ACTIVE_CONTRACTS } from "../lib/oddmaki/chain";
import { createResilientTransport } from "../lib/rpc/baseClient";

for (const f of [".env", ".env.local"]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const t = line.trim();

      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");

      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();

      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    // ignore missing env files
  }
}

interface BondRow {
  groupId: string;
  title: string;
  status: string;
  tag: string;
  leagueId: number | null;
  season: number | null;
  revision: number | null;
  part: number | null;
  marketId: string;
  requiredBondUSDC: number;
  livenessSec: number;
  rewardUSDC: number;
}

async function main(): Promise<void> {
  const venueId = BigInt(process.env.NEXT_PUBLIC_VENUE_ID || "6");
  const graphApiKey =
    process.env.GRAPH_API_KEY ?? process.env.NEXT_PUBLIC_GRAPH_API_KEY;
  const client = createOddMakiClient({
    chain: ACTIVE_CHAIN,
    transport: createResilientTransport({ bot: true }),
    subgraphEndpoint: graphApiKey
      ? buildSubgraphGatewayUrl(ACTIVE_CHAIN.id, graphApiKey)
      : undefined,
  });
  const publicClient = createPublicClient({
    chain: ACTIVE_CHAIN,
    transport: createResilientTransport({ bot: true }),
  });

  const venue = (await publicClient.readContract({
    address: ACTIVE_CONTRACTS.diamond,
    abi: VenueFacetABI,
    functionName: "getVenue",
    args: [venueId],
  })) as {
    name: string;
    umaMinBond: bigint;
    umaRewardAmount: bigint;
  };

  const venueMinBond = Number(formatUnits(BigInt(venue.umaMinBond), 6));
  const venueReward = Number(formatUnits(BigInt(venue.umaRewardAmount), 6));

  console.log(
    JSON.stringify(
      {
        venueId: String(venueId),
        name: venue.name,
        umaMinBondUSDC: venueMinBond,
        umaRewardUSDC: venueReward,
      },
      null,
      2,
    ),
  );

  const groups: any[] = [];

  for (let page = 0; page < 40; page += 1) {
    const result = (await client.public.getMarketGroups({
      venueId,
      first: 100,
      skip: page * 100,
    })) as { marketGroups?: any[] };
    const batch = result.marketGroups ?? [];

    if (!batch.length) break;
    groups.push(...batch);
    if (batch.length < 100) break;
  }

  const outrights = groups.filter((g) => isOutrightGroup(g.tags ?? []));
  const matchish = groups.filter((g) =>
    (g.tags ?? []).some((t: string) => t.startsWith("fixture-")),
  );

  console.log(
    JSON.stringify({
      totalGroups: groups.length,
      outrightGroups: outrights.length,
      fixtureGroups: matchish.length,
    }),
  );

  const bondFor = async (marketId: string) => {
    const oracle = (await publicClient.readContract({
      address: ACTIVE_CONTRACTS.diamond,
      abi: MarketsFacetABI,
      functionName: "getMarketOracleData",
      args: [BigInt(marketId)],
    })) as { requiredBond: bigint; reward: bigint; liveness: bigint };

    return {
      requiredBondUSDC: Number(formatUnits(BigInt(oracle.requiredBond), 6)),
      rewardUSDC: Number(formatUnits(BigInt(oracle.reward), 6)),
      livenessSec: Number(oracle.liveness),
    };
  };

  const rows: BondRow[] = [];
  const bondBuckets = new Map<string, number>();

  async function groupMarketIds(groupId: string): Promise<string[]> {
    const ids = (await client.market.getGroupMarketIds(
      BigInt(groupId),
    )) as bigint[];

    return ids.map((id) => id.toString());
  }

  // Process in small batches to avoid RPC rate limits
  const CONCURRENCY = 6;

  for (let i = 0; i < outrights.length; i += CONCURRENCY) {
    const chunk = outrights.slice(i, i + CONCURRENCY);

    await Promise.all(
      chunk.map(async (g) => {
        const groupId = String(g.groupId ?? g.id);
        const tags = (g.tags ?? []) as string[];
        const tag = tags.find((t) => t.startsWith("outright-")) ?? "";
        const parsed = parseOutrightTag(tag);

        try {
          const marketIds = await groupMarketIds(groupId);
          const mid = marketIds[0];

          if (!mid) {
            console.warn("no marketId", groupId, tag);

            return;
          }

          const b = await bondFor(mid);
          const key = `${b.requiredBondUSDC}|l=${b.livenessSec}|r=${b.rewardUSDC}`;

          bondBuckets.set(key, (bondBuckets.get(key) ?? 0) + 1);
          rows.push({
            groupId,
            title: String(g.title ?? g.question ?? g.marketQuestion ?? tag),
            status: String(g.status ?? ""),
            tag,
            leagueId: parsed?.leagueId ?? null,
            season: parsed?.season ?? null,
            revision: parsed?.revision ?? null,
            part: parsed?.part ?? null,
            marketId: mid,
            ...b,
          });
        } catch (error) {
          console.error(
            "bond fail",
            groupId,
            error instanceof Error ? error.message : error,
          );
        }
      }),
    );
    process.stdout.write(`\raudited ${Math.min(i + CONCURRENCY, outrights.length)}/${outrights.length}`);
  }
  console.log("");

  // Spot-check: first 5 multi-outcome groups share bond across markets
  let multiChecked = 0;

  for (const g of outrights) {
    if (multiChecked >= 5) break;
    const marketIds = await groupMarketIds(String(g.groupId ?? g.id));

    if (marketIds.length < 2) continue;
    const a = await bondFor(marketIds[0]!);
    const b = await bondFor(marketIds[1]!);

    console.log(
      "multiCheck",
      JSON.stringify({
        group: g.groupId,
        a,
        b,
        same: a.requiredBondUSDC === b.requiredBondUSDC,
      }),
    );
    multiChecked += 1;
  }

  // Sample a few match markets for comparison
  const matchSamples: BondRow[] = [];

  for (const g of matchish.slice(0, 12)) {
    const groupId = String(g.groupId ?? g.id);
    const marketIds = await groupMarketIds(groupId);
    const mid = marketIds[0];

    if (!mid) continue;
    const b = await bondFor(mid);

    matchSamples.push({
      groupId,
      title: String(g.title ?? g.marketQuestion ?? ""),
      status: String(g.status ?? ""),
      tag:
        ((g.tags ?? []) as string[]).find((t) => t.startsWith("fixture-")) ?? "",
      leagueId: null,
      season: null,
      revision: null,
      part: null,
      marketId: mid,
      ...b,
    });
  }

  const byBond = new Map<number, BondRow[]>();

  for (const r of rows) {
    const list = byBond.get(r.requiredBondUSDC) ?? [];

    list.push(r);
    byBond.set(r.requiredBondUSDC, list);
  }

  console.log("\nBOND_BUCKETS", Object.fromEntries(bondBuckets));
  console.log(
    "UNIQUE_BONDS",
    [...byBond.keys()].sort((a, b) => a - b),
  );

  for (const [bond, list] of [...byBond.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`\n=== requiredBond=${bond} USDC (${list.length} groups) ===`);
    const byRev = new Map<string, number>();

    for (const r of list) {
      const k = `season=${r.season} rev=${r.revision ?? "none"} status=${r.status} liveness=${r.livenessSec}`;

      byRev.set(k, (byRev.get(k) ?? 0) + 1);
    }
    console.log("breakdown", Object.fromEntries(byRev));
    for (const r of list.slice(0, 12)) {
      const league =
        r.leagueId != null
          ? (LEAGUE_BY_ID[r.leagueId]?.name ??
            TOP_LEAGUES.find((l) => l.id === r.leagueId)?.tag ??
            String(r.leagueId))
          : "?";

      console.log(
        `  ${r.tag} | ${league} | m=${r.marketId} | live=${r.livenessSec}s | reward=${r.rewardUSDC} | ${r.status}`,
      );
    }
    if (list.length > 12) console.log(`  ... +${list.length - 12} more`);
  }

  console.log("\nMATCH_SAMPLES");
  for (const r of matchSamples) {
    console.log(
      `  ${r.tag} | bond=${r.requiredBondUSDC} | live=${r.livenessSec}s | reward=${r.rewardUSDC} | ${r.status}`,
    );
  }

  // Coverage: which TOP_LEAGUES have public v2/season outrights
  const publicRev = process.env.NEXT_PUBLIC_OUTRIGHT_TAG_REVISION?.trim() || null;
  const covered = new Set(
    rows
      .filter((r) => {
        if (r.season !== 2026) return false;
        if (!publicRev) return true;
        if (r.tag.includes(`-${publicRev}`)) return true;

        return r.revision == null;
      })
      .map((r) => r.leagueId)
      .filter((id): id is number => id != null),
  );
  const missing = TOP_LEAGUES.filter((l) => !covered.has(l.id)).map(
    (l) => `${l.id}:${l.tag}`,
  );

  console.log(
    JSON.stringify(
      {
        publicOutrightRevision: publicRev,
        coveredLeagues: covered.size,
        topLeaguesConfigured: TOP_LEAGUES.length,
        missingTopLeagues: missing,
      },
      null,
      2,
    ),
  );

  writeFileSync(
    ".outright-bond-audit.json",
    JSON.stringify(
      {
        scannedAt: new Date().toISOString(),
        venueMinBond,
        venueReward,
        bondBuckets: Object.fromEntries(bondBuckets),
        rows,
        matchSamples,
        missingTopLeagues: missing,
      },
      null,
      2,
    ),
  );
  console.log(`\nWrote .outright-bond-audit.json rows=${rows.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
