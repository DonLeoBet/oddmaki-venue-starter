"use client";

import { stripFixtureMeta } from "@/lib/football/fixture-metadata";

interface MarketDescriptionProps {
  description: string | undefined;
}

export function MarketDescription({ description }: MarketDescriptionProps) {
  if (!description) return null;

  const visible = stripFixtureMeta(description);

  if (!visible) return null;

  return (
    <div className="rounded-xl border border-default-200 p-4">
      <h2 className="text-lg font-semibold mb-2">Description</h2>
      <p className="text-sm text-default-500 whitespace-pre-wrap">{visible}</p>
    </div>
  );
}
