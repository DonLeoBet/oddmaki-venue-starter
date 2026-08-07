import { NextResponse } from "next/server";

import { isApiFootballConfigured, searchTeamLogo } from "@/lib/apiFootball";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const namesParam = searchParams.get("names");

  if (!namesParam) {
    return NextResponse.json(
      { error: "Missing names query param" },
      { status: 400 },
    );
  }

  if (!isApiFootballConfigured()) {
    return NextResponse.json({ logos: {}, configured: false });
  }

  const names = namesParam
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const logos: Record<string, { logo: string | null; country: string | null }> =
    {};

  await Promise.all(
    names.map(async (name) => {
      const result = await searchTeamLogo(name);
      logos[name] = result;
    }),
  );

  return NextResponse.json({ logos, configured: true });
}
