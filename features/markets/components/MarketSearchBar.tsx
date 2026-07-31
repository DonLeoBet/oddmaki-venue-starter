"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Spinner } from "@heroui/spinner";

import { SearchIcon } from "@/components/icons";
import { useMarketSearch } from "../hooks/useMarketSearch";

function SearchResultLabel({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-0.5">
      <span className="text-sm font-medium line-clamp-1">{title}</span>
      <span className="text-xs text-default-400 line-clamp-1">{subtitle}</span>
    </div>
  );
}

export function MarketSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const { results, isSearching, isIndexLoading } = useMarketSearch(query);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const navigateToSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();

      if (!trimmed) return;

      if (pathname === "/") {
        router.push(`/?q=${encodeURIComponent(trimmed)}`);
        return;
      }

      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    },
    [pathname, router],
  );

  const handleSelection = useCallback(
    (key: React.Key | null) => {
      if (!key) return;

      const hit = results.find((result) => result.groupId === String(key));

      if (hit) {
        setQuery("");
        router.push(hit.href);
      }
    },
    [results, router],
  );

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const displayTitle = (hit: (typeof results)[number]) => {
    if (hit.home && hit.away) return `${hit.home} vs ${hit.away}`;

    return hit.title;
  };

  return (
    <Autocomplete
      allowsCustomValue
      aria-label="Search markets"
      className="max-w-xl w-full"
      inputValue={query}
      isLoading={isSearching || isIndexLoading}
      items={results}
      listboxProps={{
        emptyContent:
          query.trim().length < 2 ?
            "Type at least 2 characters"
          : "No markets found",
      }}
      placeholder="Search teams, leagues, fixture ID…"
      selectedKey={null}
      startContent={
        isSearching || isIndexLoading ?
          <Spinner color="current" size="sm" />
        : <SearchIcon className="text-default-400 pointer-events-none shrink-0" />
      }
      onInputChange={setQuery}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          if (results.length === 1) {
            router.push(results[0].href);
            setQuery("");
            return;
          }

          navigateToSearch(query);
        }
      }}
      onSelectionChange={handleSelection}
    >
      {(item) => (
        <AutocompleteItem key={item.groupId} textValue={displayTitle(item)}>
          <SearchResultLabel
            subtitle={item.subtitle}
            title={displayTitle(item)}
          />
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
}
