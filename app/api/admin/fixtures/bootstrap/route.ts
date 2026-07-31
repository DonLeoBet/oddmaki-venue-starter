import { LEAGUES } from "@/config/leagues";
import { NextResponse } from "next/server";

import {
  listAdminFixtures,
  createFixtureMarket,
  type AdminCreateResult,
} from "@/lib/admin/fixtures-service";
import { requireAdminAuth } from "@/lib/server/auth";

export const maxDuration = 300;

/**
 * Bootstrap one sample fixture per league with the full standard market set.
 * POST body: { dryRun?: boolean }
 */
export async function POST(request: Request) {
  const authError = requireAdminAuth(request);

  if (authError) return authError;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean;
    };
    const dryRun = body.dryRun ?? false;
    const leagueIds = Array.from(
      new Set(Object.values(LEAGUES).map((l) => l.id)),
    );
    const listed = await listAdminFixtures({ page: 1 });
    const results: AdminCreateResult[] = [];

    for (const leagueId of leagueIds) {
      const row = listed.fixtures.find(
        (f) => f.leagueId === leagueId && !f.alreadyExists,
      );
      if (!row) {
        results.push({
          fixtureId: 0,
          status: "skipped",
          reason: `No new fixture for league ${leagueId}`,
        });
        continue;
      }

      const { result } = await createFixtureMarket({
        fixtureId: row.fixtureId,
        dryRun,
      });
      results.push(result);
    }

    return NextResponse.json({ ok: true, dryRun, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
