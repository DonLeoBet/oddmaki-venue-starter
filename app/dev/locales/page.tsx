import {
  ALL_MARKET_TYPE_IDS,
  getAllSupportedLocales,
  getMarketLabels,
} from "@/config/marketTypes";
import type { MarketTypeId } from "@/config/marketTypes";

const PREVIEW_MARKET_TYPES: MarketTypeId[] = ["1x2", "btts", "ou25"];

export default function DevLocalesPage() {
  const locales = getAllSupportedLocales();

  return (
    <section className="flex flex-col gap-8 pt-4 pb-12 md:pt-6 max-w-5xl mx-auto px-4">
      <header>
        <h1 className="text-2xl font-bold">Market label locales</h1>
        <p className="mt-2 text-default-500 text-sm">
          Preview of{" "}
          <code className="text-xs bg-default-100 px-1 py-0.5 rounded">
            config/marketTypeLabels.ts
          </code>{" "}
          — on-chain markets use canonical keys only (
          <code className="text-xs">btts:yes</code>,{" "}
          <code className="text-xs">1x2:home</code>).
        </p>
        <p className="mt-1 text-xs text-default-400">
          {locales.length} locales · {ALL_MARKET_TYPE_IDS.length} market types
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {locales.map((locale) => (
          <article
            key={locale}
            className="rounded-xl border border-default-200 p-4"
          >
            <h2 className="text-lg font-semibold mb-3">{locale}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {PREVIEW_MARKET_TYPES.map((marketType) => {
                const labels = getMarketLabels(marketType, locale);
                return (
                  <div
                    key={marketType}
                    className="rounded-lg bg-default-50 p-3 text-sm"
                  >
                    <p className="font-medium text-default-700">
                      {labels.tabLabel}
                    </p>
                    <p className="text-xs text-default-500 mt-0.5">
                      {labels.title}
                    </p>
                    <ul className="mt-2 space-y-0.5 text-xs text-default-600">
                      {Object.entries(labels.outcomes).map(([key, label]) => (
                        <li key={key}>
                          <span className="text-default-400">{key}:</span>{" "}
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
