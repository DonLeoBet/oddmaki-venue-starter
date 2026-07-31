import { KICKOFF_TAG_PREFIX } from "./constants";
import { formatSearchKickoff } from "@/features/markets/utils/matchMarketSearch";

const MATCH_RESULT_DATE = /Match Result \((.+)\)\s*$/;

export function kickoffUnixFromTags(tags: string[]): number | null {
  for (const tag of tags) {
    if (!tag.startsWith(KICKOFF_TAG_PREFIX)) continue;

    const unix = Number(tag.slice(KICKOFF_TAG_PREFIX.length));

    if (Number.isFinite(unix) && unix > 0) return unix;
  }

  return null;
}

export function kickoffUnixFromTitle(title?: string): number | null {
  if (!title) return null;

  const match = title.match(MATCH_RESULT_DATE);

  if (!match?.[1]) return null;

  const ms = Date.parse(match[1].trim());

  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

export function kickoffUnixFromGroup(tags: string[], title?: string): number | null {
  return kickoffUnixFromTags(tags) ?? kickoffUnixFromTitle(title);
}

export function formatKickoffFromGroup(tags: string[], title?: string): string {
  const unix = kickoffUnixFromGroup(tags, title);

  return unix ? formatSearchKickoff(unix) : "";
}
