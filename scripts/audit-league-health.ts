/**
 * League/match health snapshot after bond audit.
 * Requires .outright-bond-audit.json from scripts/audit-outright-bonds.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  MarketsFacetABI,
  buildSubgraphGatewayUrl,
  createOddMakiClient,
} from "@oddmaki-protocol/sdk";
import { createPublicClient, formatUnits } from "viem";

import { LEAGUE_BY_ID } from "../config/leagues";
import { TOP_LEAGUES } from "../config/top-leagues";
import { kickoffUnixFromTags } from "../lib/football/kickoff-display";
import {
  fixtureIdFromTag,
  isFixtureTag,
} from "../lib/football/map-fixture-to-market-group";
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
    // ignore
  }
}

async function main(): Promise<void> {
  const audit = JSON.parse(readFileSync(".outright-bond-audit.json", "utf8")) as {
    venueMinBond: number;
    rows: Array<{
      tag: string;
      status: string;
      leagueId: number | null;
      season: number | null;
      revision: number | null;
      requiredBondUSDC: number;
      livenessSec: number;
    }>;
  };
  const rows = audit.rows;

  const activeV2 = rows.filter(
    (r) => r.season === 2026 && r.revision === 2 && r.status === "Active",
  );
  const draftV2 = rows.filter(
    (r) => r.season === 2026 && r.revision === 2 && r.status === "Draft",
  );
  const legacy2026 = rows.filter(
    (r) => r.season === 2026 && (r.revision == null || r.revision === 0),
  );
  const legacy2025 = rows.filter((r) => r.season === 2025);

  const byLeague = new Map<number, (typeof rows)[0]>();

  for (const r of activeV2) {
    if (r.leagueId != null) byLeague.set(r.leagueId, r);
  }

  const missing = TOP_LEAGUES.filter((l) => !byLeague.has(l.id));
  const present = TOP_LEAGUES.filter((l) => byLeague.has(l.id));

  console.log(
    JSON.stringify(
      {
        venueMinBond: audit.venueMinBond,
        outrightBondUnique: [...new Set(rows.map((r) => r.requiredBondUSDC))],
        outrightLivenessUnique: [...new Set(rows.map((r) => r.livenessSec))],
        counts: {
          audited: rows.length,
          activeV2: activeV2.length,
          draftV2: draftV2.length,
          legacy2026NoRev: legacy2026.length,
          season2025: legacy2025.length,
        },
        topLeagueCoverage: {
          present: present.length,
          missing: missing.length,
          missingList: missing.map((l) => `${l.id}:${l.tag}`),
        },
      },
      null,
      2,
    ),
  );

  console.log("\nLEGACY_NO_V2");
  for (const r of [...legacy2026, ...legacy2025]) {
    const name =
      TOP_LEAGUES.find((l) => l.id === r.leagueId)?.tag ??
      LEAGUE_BY_ID[r.leagueId ?? -1]?.name ??
      r.leagueId;

    console.log(
      `  ${r.tag} | ${name} | ${r.status} | bond=${r.requiredBondUSDC}`,
    );
  }

  console.log("\nDRAFT_V2");
  for (const r of draftV2) {
    const name =
      TOP_LEAGUES.find((l) => l.id === r.leagueId)?.tag ?? String(r.leagueId);

    console.log(`  ${r.tag} | ${name}`);
  }

  const venueId = 6n;
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

  const now = Math.floor(Date.now() / 1000);
  const soonHorizon = now + 7 * 24 * 3600;
  const matchRows: Array<{
    groupId: string;
    status: string;
    title: string;
    fixtureId: number | null;
    kickoffUnix: number | null;
  }> = [];

  for (const g of groups) {
    const tags = (g.tags ?? []) as string[];

    if (!tags.some(isFixtureTag)) continue;
    const fixtureTag = tags.find(isFixtureTag)!;

    matchRows.push({
      groupId: String(g.groupId ?? g.id),
      status: String(g.status ?? ""),
      title: String(g.marketQuestion ?? g.title ?? ""),
      fixtureId: fixtureIdFromTag(fixtureTag),
      kickoffUnix: kickoffUnixFromTags(tags),
    });
  }

  const activeMatches = matchRows.filter(
    (m) => m.status === "Active" || m.status === "Paused",
  );
  const withKick = activeMatches.filter((m) => m.kickoffUnix != null);
  const pastKickStillOpen = withKick
    .filter((m) => (m.kickoffUnix as number) < now)
    .sort((a, b) => (a.kickoffUnix as number) - (b.kickoffUnix as number));
  const next7d = withKick
    .filter(
      (m) =>
        (m.kickoffUnix as number) >= now &&
        (m.kickoffUnix as number) <= soonHorizon,
    )
    .sort((a, b) => (a.kickoffUnix as number) - (b.kickoffUnix as number));

  console.log(
    JSON.stringify(
      {
        fixtureGroups: matchRows.length,
        activeOrPaused: activeMatches.length,
        withKickoff: withKick.length,
        pastKickoffStillListed: pastKickStillOpen.length,
        kickoffsNext7d: next7d.length,
        missingKickoffTag: activeMatches.filter((m) => m.kickoffUnix == null)
          .length,
      },
      null,
      2,
    ),
  );

  console.log("\nPAST_KICKOFF_STILL_ACTIVE (up to 30)");
  for (const m of pastKickStillOpen.slice(0, 30)) {
    const ageH = ((now - (m.kickoffUnix as number)) / 3600).toFixed(1);

    console.log(
      `  ${new Date((m.kickoffUnix as number) * 1000).toISOString()} (+${ageH}h) | ${m.status} | ${m.title.slice(0, 70)} | g=${m.groupId} f=${m.fixtureId}`,
    );
  }

  console.log("\nNEXT_7D_KICKOFFS (up to 50)");
  for (const m of next7d.slice(0, 50)) {
    console.log(
      `  ${new Date((m.kickoffUnix as number) * 1000).toISOString()} | ${m.status} | ${m.title.slice(0, 70)} | g=${m.groupId}`,
    );
  }

  const recent = matchRows.slice(0, 50);
  const bondDist = new Map<string, number>();

  for (const m of recent) {
    try {
      const ids = (await client.market.getGroupMarketIds(
        BigInt(m.groupId),
      )) as bigint[];

      if (!ids[0]) continue;
      const oracle = (await publicClient.readContract({
        address: ACTIVE_CONTRACTS.diamond,
        abi: MarketsFacetABI,
        functionName: "getMarketOracleData",
        args: [ids[0]],
      })) as { requiredBond: bigint; liveness: bigint };
      const bond = Number(formatUnits(BigInt(oracle.requiredBond), 6));
      const live = Number(oracle.liveness);
      const key = `${bond}USDC|${live}s`;

      bondDist.set(key, (bondDist.get(key) ?? 0) + 1);
    } catch {
      // skip
    }
  }
  console.log("\nRECENT_MATCH_BOND_DIST", Object.fromEntries(bondDist));

  const earlyEndHints = [
    { id: 253, note: "MLS — through Oct/Nov" },
    { id: 71, note: "Brasileirão — ends ~Dec" },
    { id: 113, note: "Allsvenskan — often Nov" },
    { id: 103, note: "Eliteserien — often Nov/Dec" },
    { id: 244, note: "Veikkausliiga — often Oct" },
    { id: 357, note: "Irish Premier — Oct/Nov" },
    { id: 98, note: "J1 — Dec" },
    { id: 292, note: "K League — Oct/Nov" },
    { id: 13, note: "Libertadores — knockout can end earlier" },
    { id: 11, note: "Sudamericana — knockout can end earlier" },
  ];

  console.log("\nOUTRIGHTS_EARLIER_SEASON_ENDS");
  for (const h of earlyEndHints) {
    const row = activeV2.find((r) => r.leagueId === h.id);

    console.log(`  ${row ? "HAVE" : "MISS"} ${h.id} — ${h.note}`);
  }

  writeFileSync(
    ".league-health-snapshot.json",
    JSON.stringify(
      {
        scannedAt: new Date().toISOString(),
        outrightBond: 250,
        venueMinBond: audit.venueMinBond,
        coverage: {
          present: present.map((l) => l.id),
          missing: missing.map((l) => ({ id: l.id, tag: l.tag })),
        },
        pastKickoffStillOpen: pastKickStillOpen.slice(0, 80),
        next7d: next7d.slice(0, 100),
        draftV2: draftV2.map((r) => r.tag),
        legacy: [...legacy2026, ...legacy2025].map((r) => ({
          tag: r.tag,
          status: r.status,
          bond: r.requiredBondUSDC,
        })),
      },
      null,
      2,
    ),
  );
  console.log("\nWrote .league-health-snapshot.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
