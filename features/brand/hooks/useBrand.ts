"use client";

import { useMemo, useCallback } from "react";

import { BRAND_CONFIG, getBrandSupportedLocales } from "@/config/brand.config";
import { BRAND_ROUTING, type BrandId } from "@/config/brandRouting";
import { BRAND_SEO } from "@/config/brandSeo";
import { BRAND_MARKETS } from "@/config/brandMarkets";
import type { MarketTypeId } from "@/config/marketTypes";
import {
  getMarketLabels,
  getMarketTitle,
  getMarketTabLabel,
  getOutcomeLabel,
} from "@/config/marketTypes";
import type { Locale } from "@/config/locales";
import {
  buildCategoryPath,
  marketTypeFromSlug,
  marketTypeToSlug,
} from "@/config/brandRouting";

export function useBrand() {
  const brandId = BRAND_CONFIG.id as BrandId;
  const locale = BRAND_CONFIG.defaultLocale;
  const supportedLocales = getBrandSupportedLocales(brandId);

  const getMarketLabelsForBrand = useCallback(
    (marketType: MarketTypeId, lang: Locale = locale) =>
      getMarketLabels(marketType, lang),
    [locale],
  );

  return useMemo(
    () => ({
      brandId,
      brandName: BRAND_CONFIG.name,
      domain: BRAND_CONFIG.domain,
      locale,
      /** @deprecated Use locale */
      lang: locale,
      supportedLocales,
      routing: BRAND_ROUTING[brandId],
      seo: BRAND_SEO[brandId],
      markets: BRAND_MARKETS[brandId],
      getMarketLabels: getMarketLabelsForBrand,
      getMarketTitle: (marketType: MarketTypeId, lang: Locale = locale) =>
        getMarketTitle(marketType, lang),
      getMarketTabLabel: (marketType: MarketTypeId, lang: Locale = locale) =>
        getMarketTabLabel(marketType, lang),
      getOutcomeLabel: (
        marketType: MarketTypeId,
        outcomeKey: string,
        lang: Locale = locale,
      ) => getOutcomeLabel(marketType, outcomeKey, lang),
      buildCategoryPath: (
        leagueSlug: string,
        marketType: Parameters<typeof buildCategoryPath>[2],
      ) => buildCategoryPath(brandId, leagueSlug, marketType),
      marketTypeFromSlug: (slug: string) => marketTypeFromSlug(brandId, slug),
      marketTypeToSlug: (marketType: Parameters<typeof marketTypeToSlug>[1]) =>
        marketTypeToSlug(brandId, marketType),
    }),
    [brandId, locale, supportedLocales, getMarketLabelsForBrand],
  );
}

export type UseBrandReturn = ReturnType<typeof useBrand>;
