import { NextResponse } from "next/server";

import { OUTRIGHT_SEASON_YEAR } from "@/config/top-leagues";
import { fetchLeagueTeamsById } from "@/lib/football/fetch-league-teams";

export const runtime = "nodejs";

/** Public read-only league squad lookup (logos) for outright markets. */
export async function GET(
  request: Request,
  context: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId: leagueIdParam } = await context.params;
  const leagueId = Number(leagueIdParam);
  const { searchParams } = new URL(request.url);
  const seasonParam = searchParams.get("season");
  const season =
    seasonParam != null && Number.isFinite(Number(seasonParam))
      ? Number(seasonParam)
      : OUTRIGHT_SEASON_YEAR;

  if (!Number.isFinite(leagueId) || leagueId <= 0) {
    return NextResponse.json({ error: "Invalid league id" }, { status: 400 });
  }

  try {
    const teams = await fetchLeagueTeamsById(leagueId, season);

    return NextResponse.json(
      { leagueId, season, teams },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load league teams";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
