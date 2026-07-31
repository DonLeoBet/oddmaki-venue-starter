import type { BrandId } from "./brandRouting";
import { resolveBrandId } from "./brandRouting";
import type { Locale } from "./locales";
import { resolveLocale } from "./locales";

/**
 * Per-brand locale defaults. Override at deploy time via NEXT_PUBLIC_DEFAULT_LANGUAGE.
 *
 * ## Adding a new country/region brand (e.g. Vietnam)
 * 1. Add locale strings to `config/marketTypeLabels.ts` if missing.
 * 2. Add a BRAND_ID entry below with defaultLocale + supportedLocales.
 * 3. Add routing/SEO/markets entries in brandRouting, brandSeo, brandMarkets.
 * 4. Set env: NEXT_PUBLIC_BRAND_ID, NEXT_PUBLIC_BRAND_NAME, NEXT_PUBLIC_BRAND_DOMAIN,
 *    NEXT_PUBLIC_DEFAULT_LANGUAGE.
 * No new on-chain markets are required — all brands share VENUE_ID liquidity.
 */
export interface BrandLocaleConfig {
  defaultLocale: Locale;
  supportedLocales: Locale[];
}

export const BRAND_LOCALE_CONFIG: Record<BrandId, BrandLocaleConfig> = {
  polyfootball: {
    defaultLocale: "en",
    supportedLocales: ["en", "nl"],
  },
  topclass: {
    defaultLocale: "en",
    supportedLocales: ["en"],
  },
  glazenbol: {
    defaultLocale: "nl",
    supportedLocales: ["nl", "en"],
  },
};

/**
 * Future country brands — copy this block into BrandId + configs when launching.
 *
 * poly-vi (Vietnam):
 *   defaultLocale: "vi"
 *   visibleLeagues: premier-league, la-liga, serie-a, bundesliga, eredivisie, champions-league
 *   visibleMarketTypes: ["1x2", "btts", "ou25"]
 *   SEO patterns in Vietnamese (see brandSeo template below)
 *
 * poly-de: defaultLocale "de", focus Bundesliga + UCL + PL
 * poly-es: defaultLocale "es", focus La Liga + UCL + PL
 * poly-tr: defaultLocale "tr"
 * poly-id: defaultLocale "id"
 * poly-th: defaultLocale "th"
 */
export const FUTURE_BRAND_LOCALE_EXAMPLES: Record<
  string,
  BrandLocaleConfig
> = {
  "poly-vi": { defaultLocale: "vi", supportedLocales: ["vi", "en"] },
  "poly-de": { defaultLocale: "de", supportedLocales: ["de", "en"] },
  "poly-es": { defaultLocale: "es", supportedLocales: ["es", "en"] },
  "poly-tr": { defaultLocale: "tr", supportedLocales: ["tr", "en"] },
  "poly-id": { defaultLocale: "id", supportedLocales: ["id", "en"] },
  "poly-th": { defaultLocale: "th", supportedLocales: ["th", "en"] },
};

export function getBrandLocaleConfig(brandId: BrandId): BrandLocaleConfig {
  return BRAND_LOCALE_CONFIG[brandId];
}

export function resolveBrandDefaultLocale(brandId: BrandId): Locale {
  const envLocale = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE;
  const config = getBrandLocaleConfig(brandId);
  return resolveLocale(envLocale, config.defaultLocale);
}

/**
 * White-label brand configuration (Poly.Football, TopClass, GlazenBol, etc.)
 * Override via NEXT_PUBLIC_* env vars per deployment.
 */
export const BRAND_CONFIG = {
  id: resolveBrandId(process.env.NEXT_PUBLIC_BRAND_ID),
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Poly.Football",
  domain: process.env.NEXT_PUBLIC_BRAND_DOMAIN || "poly.football",
  logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || "/logo.png",
  get defaultLocale(): Locale {
    return resolveBrandDefaultLocale(this.id);
  },
  /** @deprecated Use defaultLocale */
  get defaultLanguage(): Locale {
    return this.defaultLocale;
  },
  theme: {
    primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || "#00F0FF",
    backgroundColor:
      process.env.NEXT_PUBLIC_BRAND_BACKGROUND_COLOR || "#0a0b0d",
  },
  traditionalBookieUrl:
    process.env.NEXT_PUBLIC_TRADITIONAL_BOOKIE_URL || "https://topclass.bet",
} as const;

export type BrandConfig = typeof BRAND_CONFIG;

export function getBrandSupportedLocales(brandId: BrandId): Locale[] {
  return [...getBrandLocaleConfig(brandId).supportedLocales];
}
