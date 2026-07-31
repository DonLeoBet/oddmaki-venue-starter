import { NextResponse } from "next/server";

import { runTestBatchDryRun } from "@/lib/admin/test-batch-service";
import { requireAdminAuth } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Preview test-batch markets (1 fixture per league, kickoff +9…+11 days).
 * No on-chain transactions — only API-Football reads + subgraph tag lookup.
 */
export async function POST(request: Request) {
  const authError = requireAdminAuth(request);

  if (authError) return authError;

  try {
    const result = await runTestBatchDryRun();

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/admin/fixtures/dry-run] failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
