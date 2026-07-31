"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { MarketCreationWizard } from "@/features/market-creation";
import { BRAND_CONFIG } from "@/config/brand.config";
import { venueConfig } from "@/config/venue.config";
import { fonts } from "@/lib/tokens";

export default function CreateMarketPage() {
  const router = useRouter();
  const { primaryColor, backgroundColor } = BRAND_CONFIG.theme;
  const brandName = venueConfig.branding.name;

  const handleClose = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  return (
    <section className="flex flex-1 flex-col gap-5 pt-4 pb-10 md:pt-6 md:pb-12">
      <div
        className="rounded-xl border p-4 sm:p-5"
        style={{
          backgroundColor,
          borderColor: `${primaryColor}40`,
          boxShadow: `0 0 24px ${primaryColor}14`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <BrandLogo priority height={44} />
            <div
              className="min-w-0 border-l pl-4"
              style={{ borderColor: `${primaryColor}33` }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: primaryColor }}
              >
                {brandName} · Create
              </p>
              <h1
                className="text-xl font-bold sm:text-2xl"
                style={{ fontFamily: fonts.sans, letterSpacing: "-0.02em" }}
              >
                Create market
              </h1>
              <p
                className="mt-1 text-sm"
                style={{ color: "#888", fontFamily: fonts.sans }}
              >
                Pick a market type, configure it, and publish on-chain.
              </p>
            </div>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-white/20"
            style={{
              background: "transparent",
              borderColor: "#ffffff14",
              color: "#bbb",
              fontFamily: fonts.sans,
              cursor: "pointer",
            }}
            type="button"
            onClick={handleClose}
          >
            <svg fill="none" height="12" viewBox="0 0 16 16" width="12">
              <path
                d="M10 3L5 8L10 13"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            Cancel
          </button>
        </div>
      </div>

      <MarketCreationWizard onClose={handleClose} />
    </section>
  );
}
