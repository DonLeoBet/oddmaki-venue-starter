"use client";

import type { MarketTypeId } from "@/config/marketTypes";
import { getLeagueName } from "@/config/leagues";
import { useCategoryMarkets } from "@/features/markets/hooks/useCategoryMarkets";
import { useBrand } from "@/features/brand";
import { buildCategorySeo } from "@/config/brandSeo";
import { BRAND_CONFIG } from "@/config/brand.config";
import { MarketGroupCard } from "@/features/market-groups/components/MarketGroupCard";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";

interface CategoryMarketsViewProps {
  leagueSlug: string;
  marketType: MarketTypeId;
}

export function CategoryMarketsView({
  leagueSlug,
  marketType,
}: CategoryMarketsViewProps) {
  const { brandId, locale, getMarketTitle } = useBrand();
  const { groups, isLoading, error } = useCategoryMarkets(leagueSlug, marketType);

  const seo = buildCategorySeo(
    brandId,
    BRAND_CONFIG.name,
    leagueSlug,
    marketType,
    locale,
    new Date().getUTCFullYear(),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col gap-6 pt-4 pb-8 md:pt-6 md:pb-10">
        <header>
          <h1 className="text-2xl font-bold">{seo.h1}</h1>
        </header>
        <Card>
          <CardBody>
            <p className="text-danger text-sm">
              Failed to load markets for this league. Please refresh and try again.
            </p>
          </CardBody>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 pt-4 pb-8 md:pt-6 md:pb-10">
      <header>
        <h1 className="text-2xl font-bold">{seo.h1}</h1>
        <p className="mt-2 text-default-500 text-sm max-w-2xl">
          {seo.description}
        </p>
        <p className="mt-1 text-xs text-default-400">
          {getMarketTitle(marketType)} · {getLeagueName(leagueSlug, locale)}
        </p>
      </header>

      {groups.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">
              No active markets yet for this category. Check back after the next
              fixture sync.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <MarketGroupCard
              key={group.groupId}
              focusMarketType={marketType}
              group={group}
            />
          ))}
        </div>
      )}
    </section>
  );
}
