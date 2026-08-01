"use client";

import NextLink from "next/link";

import { getClubPage, fixtureTitleMatchesClub } from "@/config/clubPages";
import { useBrand } from "@/features/brand";
import { MarketGroupCard } from "@/features/market-groups/components/MarketGroupCard";
import { getMatchGroupHref } from "@/features/market-groups/utils/matchGroupPaths";
import { useUnifiedFeed } from "@/features/markets/hooks/useUnifiedFeed";
import { isNewTaxonomyMatchGroup } from "@/lib/markets/marketFilters";
import { Spinner } from "@heroui/spinner";

interface ClubPageViewProps {
  clubSlug: string;
}

export function ClubPageView({ clubSlug }: ClubPageViewProps) {
  const club = getClubPage(clubSlug);
  const { brandId, locale } = useBrand();
  const { data, isLoading } = useUnifiedFeed("volume");

  if (!club) {
    return (
      <section className="py-12 text-center text-default-500">
        Club page not found.
      </section>
    );
  }

  const groups =
    data?.pages
      .flatMap((page) => page.items)
      .filter((item) => item.type === "group")
      .map((item) => item.data)
      .filter((group) => {
        if (!fixtureTitleMatchesClub(group.marketQuestion, club)) return false;

        return isNewTaxonomyMatchGroup(group.tags, group.outcomes);
      }) ?? [];

  return (
    <section className="flex flex-col gap-6 pt-4 pb-8 md:pt-6 md:pb-10">
      <header>
        <h1 className="text-2xl font-bold">{club.label}</h1>
        <p className="mt-2 text-sm text-default-500 max-w-2xl">
          Match markets featuring {club.label}.
        </p>
      </header>

      {isLoading ?
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      : groups.length === 0 ?
        <p className="text-default-500 text-sm">No upcoming markets yet.</p>
      : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <NextLink
              key={group.groupId}
              className="block"
              href={getMatchGroupHref(
                brandId,
                {
                  groupId: group.groupId,
                  marketQuestion: group.marketQuestion,
                  tags: group.tags,
                },
                locale,
              )}
            >
              <MarketGroupCard group={group} />
            </NextLink>
          ))}
        </div>
      }
    </section>
  );
}
