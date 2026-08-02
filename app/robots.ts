import type { MetadataRoute } from "next";

import { BRAND_CONFIG } from "@/config/brand.config";

function siteOrigin(): string {
  const domain = BRAND_CONFIG.domain.replace(/^https?:\/\//, "");

  return `https://${domain.startsWith("www.") ? domain : `www.${domain}`}`;
}

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/dev/", "/create/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
