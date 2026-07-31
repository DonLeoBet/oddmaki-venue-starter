"use client";

import NextLink from "next/link";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";

import { useMarketSearch } from "../hooks/useMarketSearch";

interface MarketSearchResultsProps {
  query: string;
}

export function MarketSearchResults({ query }: MarketSearchResultsProps) {
  const { results, isSearching, isIndexLoading } = useMarketSearch(query);

  if (query.length < 2) return null;

  if (isSearching || isIndexLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-default-500">
        <Spinner size="sm" />
        <span>Searching markets…</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="mb-4">
        <CardBody>
          <p className="text-default-500">
            No markets found for &ldquo;{query}&rdquo;. Try a team name, league,
            or fixture ID.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-default-500">
        {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;
        {query}&rdquo;
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {results.map((hit) => {
          const title =
            hit.home && hit.away ? `${hit.home} vs ${hit.away}` : hit.title;

          return (
            <NextLink key={hit.groupId} href={hit.href}>
              <Card
                isPressable
                className="hover:scale-[1.01] transition-transform"
              >
                <CardBody className="gap-1">
                  <p className="font-semibold line-clamp-1">{title}</p>
                  <p className="text-xs text-default-400 line-clamp-1">
                    {hit.subtitle}
                  </p>
                </CardBody>
              </Card>
            </NextLink>
          );
        })}
      </div>
    </div>
  );
}
