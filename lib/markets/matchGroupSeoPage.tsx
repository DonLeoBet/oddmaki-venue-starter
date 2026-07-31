import type { Metadata } from "next";

import { MatchGroupSeoPage } from "@/features/market-groups/components/MatchGroupSeoPage";
import { BRAND_CONFIG } from "@/config/brand.config";
import { resolveBrandId, leagueSlugFromRoute } from "@/config/brandRouting";
import { buildMatchPageMetadata } from "@/config/brandSeo";
import { LEAGUE_BY_SLUG } from "@/config/leagues";

interface PageProps {
  params: Promise<{ leagueSlug: string; matchSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { leagueSlug, matchSlug } = await params;
  const brandId = resolveBrandId(BRAND_CONFIG.id);
  const league = leagueSlugFromRoute(brandId, leagueSlug);

  if (!league || !LEAGUE_BY_SLUG[league]) {
    return { title: "Match Markets" };
  }

  const seo = buildMatchPageMetadata(
    brandId,
    BRAND_CONFIG.name,
    BRAND_CONFIG.domain,
    league,
    matchSlug,
    BRAND_CONFIG.defaultLocale,
  );

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
  };
}

export default async function MatchGroupMarketsPage({ params }: PageProps) {
  const { leagueSlug, matchSlug } = await params;

  return <MatchGroupSeoPage leagueSlug={leagueSlug} matchSlug={matchSlug} />;
}
