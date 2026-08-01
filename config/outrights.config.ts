import { OUTRIGHT_SEASON_YEAR } from "@/config/top-leagues";
import { parseOutrightTag } from "@/lib/markets/marketFilters";

/** OddMaki NegRisk groups support 2–50 outcomes; stay under the cap with headroom. */
export const MAX_OUTRIGHT_OUTCOMES_PER_GROUP = 32;

/** Client-side revision gate — mirrors `OUTRIGHT_TAG_REVISION` on the bot. */
export function getPublicOutrightTagRevision(): string | null {
  const revision = process.env.NEXT_PUBLIC_OUTRIGHT_TAG_REVISION?.trim();

  return revision || null;
}

/** Whether an outright group belongs to the current import season + revision. */
export function isPublicOutrightGroup(tags: string[] | undefined): boolean {
  if (!tags?.length) return false;

  const outrightTag = tags.find((tag) => tag.startsWith("outright-"));

  if (!outrightTag) return false;

  const parsed = parseOutrightTag(outrightTag);

  if (!parsed) return false;

  if (parsed.season !== OUTRIGHT_SEASON_YEAR) return false;

  const requiredRevision = getPublicOutrightTagRevision();

  if (!requiredRevision) return true;

  return outrightTag.includes(`-${requiredRevision}`);
}
