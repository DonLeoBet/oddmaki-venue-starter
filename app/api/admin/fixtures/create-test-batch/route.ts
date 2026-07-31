import { NextResponse } from "next/server";

import { runTestBatchCreate } from "@/lib/admin/test-batch-service";
import { requireAdminAuth } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Create the test batch on-chain: 1 market group per league (same selection as dry-run).
 * Tags include batch-test_10d_1; uses bot wallet via OPERATOR_BOT_MNEMONIC.
 */
export async function POST(request: Request) {
  const authError = requireAdminAuth(request);

  if (authError) return authError;

  try {
    const result = await runTestBatchCreate();

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/admin/fixtures/create-test-batch] failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
