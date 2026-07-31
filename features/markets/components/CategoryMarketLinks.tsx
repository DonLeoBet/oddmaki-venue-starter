"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { useBrand } from "@/features/brand";
import { getCategoryNavGroups } from "@/config/categoryNav";
import type { BrandId } from "@/config/brandRouting";

function isLinkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CategoryMarketLinks() {
  const pathname = usePathname();
  const { brandId, locale } = useBrand();
  const groups = getCategoryNavGroups(brandId as BrandId, locale);

  if (groups.length === 0) return null;

  const isGlazenBol = brandId === "glazenbol";

  if (isGlazenBol) {
    const flatLinks = groups.flatMap((g) => g.links);

    return (
      <nav
        aria-label="Market categories"
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pb-2 border-b border-divider/50"
      >
        {flatLinks.map((link) => {
          const active = isLinkActive(pathname, link.href);

          return (
            <NextLink
              key={link.href}
              className={`text-sm whitespace-nowrap transition-colors hover:text-primary ${
                active
                  ? "font-semibold text-primary"
                  : "text-default-500 hover:underline"
              }`}
              href={link.href}
            >
              {link.label}
            </NextLink>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Market categories"
      className="flex flex-col gap-2 pb-2 border-b border-divider/50"
    >
      {groups.map((group) => (
        <div
          key={group.leagueSlug}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-default-400 shrink-0">
            {group.leagueLabel}
          </span>
          <span className="text-default-300 hidden sm:inline" aria-hidden>
            ·
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {group.links.map((link, i) => {
              const active = isLinkActive(pathname, link.href);

              return (
                <span key={link.href} className="inline-flex items-center gap-2">
                  {i > 0 && (
                    <span
                      className="text-default-300 text-xs hidden sm:inline"
                      aria-hidden
                    >
                      |
                    </span>
                  )}
                  <NextLink
                    className={`text-sm whitespace-nowrap transition-colors hover:text-primary ${
                      active
                        ? "font-semibold text-primary"
                        : "text-default-500 hover:underline"
                    }`}
                    href={link.href}
                  >
                    {link.label}
                  </NextLink>
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
