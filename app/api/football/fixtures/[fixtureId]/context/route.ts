import { NextResponse } from "next/server";

import { buildMatchPageContext } from "@/lib/football/match-page-context";

export const runtime = "nodejs";

/** Cached match context — standings, H2H, bookmaker odds, FAQ (fixture-scoped). */
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
    const data = await buildMatchPageContext(fixtureId);

    if (!data) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=21600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load match context";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
