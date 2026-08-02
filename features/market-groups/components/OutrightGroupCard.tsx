"use client";

import type { FormattedMarketGroup } from "../types";

import { Card, CardBody, CardFooter } from "@heroui/card";
import NextLink from "next/link";

import { LeagueLogo } from "@/components/football/LeagueLogo";
import { getOutrightCardMeta } from "@/lib/football/outright-display";
import { alpha, colors } from "@/lib/tokens";

interface OutrightGroupCardProps {
  group: FormattedMarketGroup;
}

/** Compact season-winner card — league crest + metadata (outcomes load on detail page). */
export function OutrightGroupCard({ group }: OutrightGroupCardProps) {
  const meta = getOutrightCardMeta(group.tags, group.marketQuestion);
  const teamCount = Number(group.activeMarketCount || group.totalMarkets || 0);

  return (
    <NextLink className="block" href={`/market/multi/${group.groupId}`}>
      <Card
        className="w-full min-h-0 sm:min-h-[160px] hover:scale-[1.02] transition-transform cursor-pointer border border-default-100/50 active:scale-[0.99]"
        style={{
          background: `linear-gradient(145deg, ${alpha(colors.neonCyan, 0.06)} 0%, transparent 55%)`,
        }}
      >
        <CardBody className="flex flex-col items-center justify-center gap-2 px-3 py-4 text-center sm:gap-3 sm:px-4 sm:py-6">
          <LeagueLogo
            plain
            name={meta.leagueName}
            size="lg"
            src={meta.logoUrl}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-sm font-bold leading-snug text-foreground line-clamp-2">
              {meta.leagueName}
            </h3>
            <p className="text-xs font-medium text-default-400">
              Outright winner
              {meta.seasonLabel ? ` · ${meta.seasonLabel}` : ""}
            </p>
            {teamCount > 0 && (
              <p className="text-[11px] text-default-500">
                {teamCount} {teamCount === 1 ? "club" : "clubs"}
              </p>
            )}
          </div>
        </CardBody>

        <CardFooter className="flex-shrink-0 justify-between gap-2">
          <span className="text-xs text-default-400">
            {group.volumeFormatted} Vol.
          </span>
          <span className="text-xs font-semibold text-primary">View market</span>
        </CardFooter>
      </Card>
    </NextLink>
  );
}
