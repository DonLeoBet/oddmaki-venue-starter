import NextLink from "next/link";
import { Button } from "@heroui/button";

import { BrandLogo } from "./BrandLogo";

import { BRAND_CONFIG } from "@/config/brand.config";
import { venueConfig } from "@/config/venue.config";

export interface AdminPageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: AdminPageHeaderProps) {
  const { name } = venueConfig.branding;
  const { primaryColor, backgroundColor } = BRAND_CONFIG.theme;

  return (
    <div
      className="mb-4 rounded-xl border p-4 sm:p-5"
      style={{
        backgroundColor,
        borderColor: `${primaryColor}40`,
        boxShadow: `0 0 24px ${primaryColor}14`,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <NextLink className="shrink-0" href="/">
            <BrandLogo priority height={48} />
          </NextLink>
          <div className="min-w-0 border-l border-default-200 pl-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: primaryColor }}
            >
              {name} · Admin
            </p>
            <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
            {subtitle ? (
              <div className="mt-1 text-sm text-default-500">{subtitle}</div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <Button as={NextLink} href="/" size="sm" variant="flat">
            ← Markets
          </Button>
        </div>
      </div>
    </div>
  );
}
