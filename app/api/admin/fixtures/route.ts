import { NextResponse } from "next/server";

import { listAdminFixtures } from "@/lib/admin/fixtures-service";
import { requireAdminAuth } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePage(value: string | null): number {
  if (!value) return 1;

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function parseLeagueId(value: string | null): number | undefined {
  if (!value || value === "all") return undefined;

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);

  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams.get("page"));
    const leagueId = parseLeagueId(searchParams.get("leagueId"));

    const data = await listAdminFixtures({ page, leagueId });

    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    console.error("[api/admin/fixtures] GET failed:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
        fixtures: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      },
      { status: 500 },
    );
  }
}
