"use client";

import type { MarketTypeId } from "@/config/marketTypes";
import { getLeagueName } from "@/config/leagues";
import { useCategoryMarkets } from "@/features/markets/hooks/useCategoryMarkets";
import { useBrand } from "@/features/brand";
import { getMatchGroupHref } from "@/features/market-groups/utils/matchGroupPaths";
import { buildCategorySeo } from "@/config/brandSeo";
import { BRAND_CONFIG } from "@/config/brand.config";
import {
  toOverviewOutcomeChips,
} from "@/features/markets/utils/overviewMarkets";
import NextLink from "next/link";
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
  const { rows, isLoading } = useCategoryMarkets(leagueSlug, marketType);

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

      {rows.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">
              No active markets yet for this category. Check back after the next
              fixture sync.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => {
            const teams = {
              home: { name: row.home },
              away: { name: row.away },
            };
            const outcomeChips = toOverviewOutcomeChips(
              row.markets,
              marketType,
              locale,
              teams,
            );

            return (
              <Card key={row.groupId}>
                <CardBody className="flex flex-row flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <NextLink
                      className="font-semibold hover:text-primary transition-colors"
                      href={getMatchGroupHref(
                        brandId,
                        {
                          groupId: row.groupId,
                          marketQuestion: row.fixtureTitle,
                          leagueSlug: row.leagueSlug,
                        },
                        locale,
                      )}
                    >
                      {row.home} vs {row.away}
                    </NextLink>
                    {row.kickoffUnix > 0 && (
                      <p className="text-xs text-default-400 mt-0.5">
                        {new Date(row.kickoffUnix * 1000).toLocaleString(
                          locale,
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "UTC",
                          },
                        )}{" "}
                        UTC
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-default-500">
                      {getMarketTitle(marketType)}
                    </span>
                    {outcomeChips.map((chip) => (
                      <span
                        key={chip.marketId}
                        className="text-xs rounded-lg bg-default-100 px-2 py-1 font-medium"
                      >
                        {chip.label} {Math.round(chip.probability)}%
                      </span>
                    ))}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
