"use client";

import { Card, CardBody } from "@heroui/card";
import { Link } from "@heroui/link";

import { useMatchFootballContext } from "@/features/football/hooks/useMatchFootballContext";
import { kickoffUnixFromTags } from "@/lib/football/kickoff-display";
import { fixtureIdFromTag, isFixtureTag } from "@/lib/football/map-fixture-to-market-group";

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD"]);

interface LiveMatchTradingNoticeProps {
  groupTags: string[] | undefined;
}

function fixtureIdFromTags(tags: string[] | undefined): number | null {
  if (!tags) return null;

  for (const tag of tags) {
    if (!isFixtureTag(tag)) continue;

    return fixtureIdFromTag(tag);
  }

  return null;
}

function isInPlayWindow(kickoffUnix: number, fixtureStatus: string | null): boolean {
  if (fixtureStatus) {
    if (FINISHED_STATUSES.has(fixtureStatus)) return false;
    if (LIVE_STATUSES.has(fixtureStatus)) return true;
  }

  const now = Math.floor(Date.now() / 1000);

  return now >= kickoffUnix && now <= kickoffUnix + 3 * 3600;
}

/**
 * Warn traders that on-chain markets keep trading during live play — unlike
 * traditional sportsbooks such as TopClass.
 */
export function LiveMatchTradingNotice({ groupTags }: LiveMatchTradingNoticeProps) {
  const kickoffUnix = kickoffUnixFromTags(groupTags ?? []);
  const hasFixture = fixtureIdFromTags(groupTags) != null;
  const { data } = useMatchFootballContext(hasFixture ? groupTags : undefined);

  if (!kickoffUnix) return null;

  const inPlay = isInPlayWindow(kickoffUnix, data?.fixtureStatus ?? null);

  if (!inPlay) return null;

  return (
    <Card className="border border-warning-500/40 bg-warning-500/10">
      <CardBody className="gap-2 py-3">
        <p className="text-sm font-semibold text-warning-600 dark:text-warning-400">
          Live match — markets stay open
        </p>
        <p className="text-xs text-default-600 leading-relaxed">
          Goals, cards, and other in-play events do <strong>not</strong> pause or
          suspend trading on Poly.Football. Prices can move instantly when news
          breaks. This is different from a traditional sportsbook, where markets
          are often suspended during live action.
        </p>
        <p className="text-xs text-default-500">
          Looking for in-play suspension and classic bookmaker lines?{" "}
          <Link
            isExternal
            className="text-xs"
            href="https://topclass.bet"
            rel="noopener noreferrer"
          >
            TopClass Sportsbook
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
