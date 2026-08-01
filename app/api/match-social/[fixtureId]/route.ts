import { NextResponse } from "next/server";

import {
  readMatchSocialThread,
  upsertMatchSocialEntry,
  type MatchPredictionPick,
} from "@/lib/server/match-social-store";

export const runtime = "nodejs";

function parseFixtureId(raw: string): number | null {
  const fixtureId = Number(raw);

  return Number.isFinite(fixtureId) && fixtureId > 0 ? fixtureId : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ fixtureId: string }> },
) {
  const fixtureId = parseFixtureId((await context.params).fixtureId);

  if (!fixtureId) {
    return NextResponse.json({ error: "Invalid fixture id" }, { status: 400 });
  }

  try {
    const thread = await readMatchSocialThread(fixtureId);

    return NextResponse.json(thread, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load match social thread";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ fixtureId: string }> },
) {
  const fixtureId = parseFixtureId((await context.params).fixtureId);

  if (!fixtureId) {
    return NextResponse.json({ error: "Invalid fixture id" }, { status: 400 });
  }

  let body: {
    address?: string;
    displayName?: string;
    prediction?: MatchPredictionPick | null;
    comment?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const address = body.address?.trim().toLowerCase();

  if (!address || !/^0x[a-f0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Valid wallet address required" }, { status: 400 });
  }

  const prediction =
    body.prediction === "home" || body.prediction === "draw" || body.prediction === "away" ?
      body.prediction
    : null;

  try {
    const thread = await upsertMatchSocialEntry({
      fixtureId,
      address,
      displayName: body.displayName ?? "Trader",
      prediction,
      comment: body.comment ?? "",
    });

    return NextResponse.json(thread);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save prediction";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
