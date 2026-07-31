import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { Suspense } from "react";

import { MarketGroupDetailView } from "@/features/market-groups/components/MarketGroupDetailView";
import { MarketGroupDetailSkeleton } from "@/features/market-groups/components/MarketGroupDetailSkeleton";
import { BRAND_CONFIG } from "@/config/brand.config";
import { buildMatchSeo } from "@/config/brandSeo";
import {
  resolveMatchGroupTitleByGroupId,
  resolveMatchSeoPathByGroupId,
} from "@/lib/markets/resolveMatchSeoPath";
import { resolveBrandId } from "@/config/brandRouting";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const brandId = resolveBrandId(BRAND_CONFIG.id);
  const teams = await resolveMatchGroupTitleByGroupId(id);
  const seoPath = await resolveMatchSeoPathByGroupId(id);

  if (!teams) {
    return { title: "Match Markets" };
  }

  const seo = buildMatchSeo(
    brandId,
    BRAND_CONFIG.name,
    teams.home,
    teams.away,
  );

  return {
    title: seo.title,
    description: seo.description,
    alternates:
      seoPath ?
        { canonical: `https://${BRAND_CONFIG.domain}${seoPath}` }
      : undefined,
  };
}

export default async function LegacyMarketGroupPage({ params }: PageProps) {
  const { id } = await params;
  const seoPath = await resolveMatchSeoPathByGroupId(id);

  if (seoPath) {
    permanentRedirect(seoPath);
  }

  return (
    <Suspense fallback={<MarketGroupDetailSkeleton />}>
      <MarketGroupDetailView groupId={id} />
    </Suspense>
  );
}
