"use client";

import { Suspense } from "react";

import { MarketGroupDetailView } from "@/features/market-groups/components/MarketGroupDetailView";
import { MarketGroupDetailSkeleton } from "@/features/market-groups/components/MarketGroupDetailSkeleton";
import { useResolveMatchGroup } from "@/features/market-groups/hooks/useResolveMatchGroup";
import { useBrand } from "@/features/brand";
import { leagueSlugFromRoute } from "@/config/brandRouting";
import { LEAGUE_BY_SLUG } from "@/config/leagues";
import { isMatchMarketsUiEnabled } from "@/config/matchMarkets.config";

interface MatchGroupSeoPageProps {
  leagueSlug: string;
  matchSlug: string;
}

function MatchGroupSeoPageContent({
  leagueSlug,
  matchSlug,
}: MatchGroupSeoPageProps) {
  const { brandId, locale } = useBrand();
  const canonicalLeague = leagueSlugFromRoute(brandId, leagueSlug);
  const matchesEnabled = isMatchMarketsUiEnabled();
  const { groupId, isLoading, resolved } = useResolveMatchGroup(
    canonicalLeague,
    matchSlug,
    locale,
  );

  if (!matchesEnabled) {
    return (
      <section className="flex flex-col gap-6 pt-4 pb-8 md:pt-6 md:pb-10">
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-foreground">
            Match market unavailable
          </p>
          <p className="mt-2 text-default-500">
            Single-match markets have been retired from this site.
          </p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return <MarketGroupDetailSkeleton />;
  }

  if (
    !resolved ||
    !groupId ||
    !canonicalLeague ||
    !LEAGUE_BY_SLUG[canonicalLeague]
  ) {
    return (
      <section className="flex flex-col gap-6 pt-4 pb-8 md:pt-6 md:pb-10">
        <div className="text-center py-12">
          <p className="text-default-500">Match markets not found</p>
        </div>
      </section>
    );
  }

  return <MarketGroupDetailView groupId={groupId} />;
}

export function MatchGroupSeoPage(props: MatchGroupSeoPageProps) {
  return (
    <Suspense fallback={<MarketGroupDetailSkeleton />}>
      <MatchGroupSeoPageContent {...props} />
    </Suspense>
  );
}
