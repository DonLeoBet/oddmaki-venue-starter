import { NextResponse } from "next/server";

import { fetchFixtureTeamsById } from "@/lib/football/fetch-fixture-teams";

export const runtime = "nodejs";

/** Public read-only fixture team lookup (logos) by API-Football fixture id. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ fixtureId: string }> },
) {
  const { fixtureId: fixtureIdParam } = await context.params;
  const fixtureId = Number(fixtureIdParam);

  if (!Number.isFinite(fixtureId) || fixtureId <= 0) {
    return NextResponse.json({ error: "Invalid fixture id" }, { status: 400 });
  }

  try {
    const teams = await fetchFixtureTeamsById(fixtureId);

    if (!teams) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
    }

    return NextResponse.json(teams, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load fixture teams";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
