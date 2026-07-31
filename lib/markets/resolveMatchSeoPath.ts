import { BRAND_CONFIG } from "@/config/brand.config";
import { resolveBrandId } from "@/config/brandRouting";
import type { Locale } from "@/config/locales";
import { createReadOnlyClient } from "@/lib/admin/fixtures-service";
import { parseFixtureTitle } from "@/lib/football/fixture-metadata";
import { getMatchGroupSeoPath } from "@/features/market-groups/utils/matchGroupPaths";
import { isOutrightGroup } from "@/lib/markets/marketFilters";

/** Server-side: resolve SEO path for a market group id (fixtures only). */
export async function resolveMatchSeoPathByGroupId(
  groupId: string,
  locale: Locale = BRAND_CONFIG.defaultLocale,
): Promise<string | null> {
  try {
    const client = createReadOnlyClient();
    const group = (await client.public.getMarketGroup(BigInt(groupId))) as {
      tags?: string[];
      marketQuestion?: string;
    } | null;

    if (!group) return null;

    const tags = group.tags ?? [];

    if (isOutrightGroup(tags)) return null;

    const formatted = client.public.formatMarketGroupForDisplay(group) as {
      marketQuestion?: string;
    };

    const brandId = resolveBrandId(BRAND_CONFIG.id);

    return getMatchGroupSeoPath(
      brandId,
      {
        groupId,
        marketQuestion: formatted.marketQuestion ?? group.marketQuestion ?? "",
        tags,
      },
      locale,
    );
  } catch {
    return null;
  }
}

export async function resolveMatchGroupTitleByGroupId(
  groupId: string,
): Promise<{ home: string; away: string } | null> {
  try {
    const client = createReadOnlyClient();
    const group = await client.public.getMarketGroup(BigInt(groupId));

    if (!group) return null;

    const formatted = client.public.formatMarketGroupForDisplay(group) as {
      marketQuestion?: string;
    };

    return parseFixtureTitle(formatted.marketQuestion ?? "");
  } catch {
    return null;
  }
}
