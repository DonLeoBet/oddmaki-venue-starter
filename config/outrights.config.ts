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

  // Only hide markets from the wrong season. During a revision rollout,
  // season-matching outright tags should still appear on league pages even when
  // the on-chain tag is a few revisions behind the env gate.
  if (parsed.season !== OUTRIGHT_SEASON_YEAR) return false;

  const requiredRevision = getPublicOutrightTagRevision();

  // If revision gate is unset, show season-matching outrights.
  if (!requiredRevision) return true;

  // Prefer the current revision when available, but do not drop every valid
  // season-matching outright while the import is catching up.
  if (outrightTag.includes(`-${requiredRevision}`)) return true;

  return true;
}
