import { Suspense } from "react";

import { HomeMarketFeed, MarketGrid } from "@/features/markets/components";
import { VenueSetupGuard } from "@/features/venue/components";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  return (
    <VenueSetupGuard>
      <section className="flex flex-1 flex-col gap-4 pt-2 pb-8 md:pt-3 md:pb-10">
        <Suspense>
          {category ? <MarketGrid /> : <HomeMarketFeed />}
        </Suspense>
      </section>
    </VenueSetupGuard>
  );
}
