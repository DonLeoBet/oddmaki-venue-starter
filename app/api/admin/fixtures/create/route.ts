import { NextRequest, NextResponse } from "next/server";

import { createFixtureMarket } from "@/lib/admin/fixtures-service";
import { requireAdminAuth } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request);

  if (authError) return authError;

  try {
    const body = (await request.json()) as {
      fixtureId?: number;
      dryRun?: boolean;
    };

    if (body.fixtureId == null || !Number.isFinite(body.fixtureId)) {
      return NextResponse.json(
        { ok: false, error: "fixtureId is required" },
        { status: 400 },
      );
    }

    const data = await createFixtureMarket({
      fixtureId: body.fixtureId,
      dryRun: body.dryRun !== false,
    });

    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
