import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryMarketsView } from "@/features/markets/components/CategoryMarketsView";
import { BRAND_CONFIG } from "@/config/brand.config";
import { resolveBrandId, marketTypeFromSlug, leagueSlugFromRoute } from "@/config/brandRouting";
import { isLeagueVisibleForBrand, isMarketTypeVisibleForBrand } from "@/config/brandMarkets";
import { buildCategorySeo } from "@/config/brandSeo";
import { LEAGUE_BY_SLUG } from "@/config/leagues";

interface PageProps {
  params: Promise<{ leagueSlug: string; marketTypeSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { leagueSlug, marketTypeSlug } = await params;
  const brandId = resolveBrandId(BRAND_CONFIG.id);
  const marketType = marketTypeFromSlug(brandId, marketTypeSlug);
  const league = leagueSlugFromRoute(brandId, leagueSlug);

  if (!marketType || !league || !LEAGUE_BY_SLUG[league]) {
    return { title: "Markets" };
  }

  const seo = buildCategorySeo(
    brandId,
    BRAND_CONFIG.name,
    league,
    marketType,
    BRAND_CONFIG.defaultLocale,
    new Date().getUTCFullYear(),
  );

  return {
    title: seo.title,
    description: seo.description,
  };
}

export default async function CategoryMarketsPage({ params }: PageProps) {
  const { leagueSlug, marketTypeSlug } = await params;
  const brandId = resolveBrandId(BRAND_CONFIG.id);
  const marketType = marketTypeFromSlug(brandId, marketTypeSlug);
  const league = leagueSlugFromRoute(brandId, leagueSlug);

  if (
    !marketType ||
    !league ||
    !LEAGUE_BY_SLUG[league] ||
    !isLeagueVisibleForBrand(brandId, league) ||
    !isMarketTypeVisibleForBrand(brandId, marketType)
  ) {
    notFound();
  }

  return <CategoryMarketsView leagueSlug={league} marketType={marketType} />;
}
