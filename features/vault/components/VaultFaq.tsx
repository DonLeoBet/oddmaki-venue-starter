"use client";

import {
  Accordion,
  AccordionItem,
} from "@heroui/accordion";

import { BRAND_CONFIG } from "@/config/brand.config";
import { getVaultConfigSafe } from "@/lib/vault/safe-config";
import { venueConfig } from "@/config/venue.config";
import { fonts } from "@/lib/tokens";

export function VaultFaq() {
  const primaryColor = BRAND_CONFIG.theme.primaryColor;
  const brandName = venueConfig.branding.name;
  const { faq } = getVaultConfigSafe();

  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 md:p-7"
      style={{
        background: "#111214",
        borderColor: "#ffffff0c",
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: primaryColor, fontFamily: fonts.sans }}
      >
        For investors
      </p>
      <h2
        className="mt-1 text-xl font-bold sm:text-2xl"
        style={{ fontFamily: fonts.sans, letterSpacing: "-0.02em" }}
      >
        How the House Pool works
      </h2>
      <p
        className="mt-2 max-w-2xl text-sm leading-relaxed"
        style={{ color: "#888", fontFamily: fonts.sans }}
      >
        Stake USDC → {brandName} markets use your liquidity as the house
        counterparty → earn trading fees and spread when volume flows. Built for
        cold-start liquidity and long-term platform alignment.
      </p>

      <Accordion
        className="mt-6 px-0"
        itemClasses={{
          base: "border-b border-white/5",
          title: "text-sm font-semibold",
          content: "text-sm text-default-500 leading-relaxed pb-4",
        }}
        selectionMode="multiple"
        variant="light"
      >
        {faq.map((item) => (
          <AccordionItem
            key={item.question}
            aria-label={item.question}
            title={item.question}
          >
            {item.answer.replace(/\{brand\}/g, brandName)}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
