import type { MetadataRoute } from "next";

import { BRAND_CONFIG } from "@/config/brand.config";
import { fetchSitemapUrlEntries } from "@/lib/seo/fetch-sitemap-urls";

function siteOrigin(): string {
  const domain = BRAND_CONFIG.domain.replace(/^https?:\/\//, "");

  return `https://${domain.startsWith("www.") ? domain : `www.${domain}`}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const entries = await fetchSitemapUrlEntries();

  return entries.map((entry) => ({
    url: `${origin}${entry.path.startsWith("/") ? entry.path : `/${entry.path}`}`,
    lastModified: entry.lastModified ?? new Date(),
    changeFrequency: entry.path.includes("/markets") ? "daily" : "weekly",
    priority: entry.path === "/" ? 1 : entry.path.includes("/markets") ? 0.8 : 0.6,
  }));
}

export const revalidate = 3600;
