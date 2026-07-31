"use client";

import type {
  AdminCreateResult,
  AdminFixtureRow,
} from "@/lib/admin/fixtures-service";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Spinner } from "@heroui/spinner";

import {
  adminCreateFixtureMarket,
  adminFetchOutrights,
  adminListFixtures,
} from "@/features/admin/actions/fixtures-admin";
import { AdminPageHeader } from "@/components/brand";
import { FixturesTestBatchPanel } from "@/features/admin/components/FixturesTestBatchPanel";
import { OUTRIGHT_SEASON_YEAR, TOP_LEAGUES } from "@/config/top-leagues";
import {
  FOOTBALL_LEAGUES,
  getFootballLeagueLabels,
} from "@/lib/football/constants";

const ALL_LEAGUES_KEY = "all";

const FIXTURE_LEAGUE_OPTIONS = Object.values(FOOTBALL_LEAGUES).map((league) => ({
  key: String(league.id),
  label: league.tag,
}));

const OUTRIGHT_LEAGUE_OPTIONS = TOP_LEAGUES.map((league) => ({
  key: String(league.id),
  label: league.tag,
}));

const LEAGUE_OPTIONS = [
  { key: ALL_LEAGUES_KEY, label: "All leagues" },
  ...OUTRIGHT_LEAGUE_OPTIONS,
  ...FIXTURE_LEAGUE_OPTIONS.filter(
    (option) => !OUTRIGHT_LEAGUE_OPTIONS.some((top) => top.key === option.key),
  ),
];

interface FixturesPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function FixturesAdminPanel() {
  const [fixtures, setFixtures] = useState<AdminFixtureRow[]>([]);
  const [venueId, setVenueId] = useState<string>("");
  const [chainId, setChainId] = useState<number>(0);
  const [fetchWindow, setFetchWindow] = useState<{
    from: string;
    to: string;
    nextPerLeague: number;
  } | null>(null);
  const [pagination, setPagination] = useState<FixturesPagination | null>(null);
  const [page, setPage] = useState(1);
  const [leagueFilter, setLeagueFilter] = useState(ALL_LEAGUES_KEY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [outrightsBusy, setOutrightsBusy] = useState(false);
  const [lastResult, setLastResult] = useState<AdminCreateResult | null>(null);
  const [lastOutrightResult, setLastOutrightResult] = useState<unknown>(null);

  const loadFixtures = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const leagueId =
        leagueFilter !== ALL_LEAGUES_KEY ? Number(leagueFilter) : undefined;

      const json = await adminListFixtures({
        page,
        leagueId:
          leagueId != null && Number.isFinite(leagueId) ? leagueId : undefined,
      });

      setFixtures(json.fixtures ?? []);
      setVenueId(json.venueId ?? "");
      setChainId(json.chainId ?? 0);
      setFetchWindow(json.fetchWindow ?? null);
      setPagination(json.pagination ?? null);

      if (json.pagination?.page && json.pagination.page !== page) {
        setPage(json.pagination.page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fixtures");
    } finally {
      setLoading(false);
    }
  }, [leagueFilter, page]);

  useEffect(() => {
    void loadFixtures();
  }, [loadFixtures]);

  const createMarket = async (fixtureId: number) => {
    setBusyId(fixtureId);
    setLastResult(null);
    setError(null);

    try {
      const json = await adminCreateFixtureMarket({ fixtureId, dryRun });

      setLastResult(json.result);
      await loadFixtures();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusyId(null);
    }
  };

  const fetchOutrights = async () => {
    setOutrightsBusy(true);
    setLastOutrightResult(null);
    setError(null);

    try {
      const outrightLeagueIds =
        leagueFilter !== ALL_LEAGUES_KEY ?
          [Number(leagueFilter)]
        : TOP_LEAGUES.map((league) => league.id);

      const json = await adminFetchOutrights({
        dryRun,
        season: OUTRIGHT_SEASON_YEAR,
        leagueIds: outrightLeagueIds.filter((id) => Number.isFinite(id)),
      });

      setLastOutrightResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Outright fetch failed");
    } finally {
      setOutrightsBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <AdminPageHeader
        actions={
          <>
            <Switch isSelected={dryRun} size="sm" onValueChange={setDryRun}>
              Dry-run (no on-chain tx)
            </Switch>
            <Button
              color="secondary"
              isLoading={outrightsBusy}
              size="sm"
              variant="flat"
              onPress={() => void fetchOutrights()}
            >
              Fetch Outrights
            </Button>
            <Button
              size="sm"
              variant="flat"
              onPress={() => void loadFixtures()}
            >
              Refresh
            </Button>
          </>
        }
        subtitle={
          <>
            Venue {venueId || "6"} · Chain {chainId || "—"} ·{" "}
            {getFootballLeagueLabels().join(", ")} upcoming
            {fetchWindow && (
              <>
                {" "}
                · window {fetchWindow.from} → {fetchWindow.to}
              </>
            )}
            {pagination && (
              <>
                {" "}
                · showing {fixtures.length} of {pagination.total} fixtures
              </>
            )}
          </>
        }
        title="Fixture Admin"
      />

      <FixturesTestBatchPanel />

      <Select
        aria-label="Filter by league"
        className="max-w-xs"
        label="Competition"
        selectedKeys={[leagueFilter]}
        size="sm"
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];

          setLeagueFilter(selected ? String(selected) : ALL_LEAGUES_KEY);
          setPage(1);
        }}
      >
        {LEAGUE_OPTIONS.map((option) => (
          <SelectItem key={option.key}>{option.label}</SelectItem>
        ))}
      </Select>

      {error && (
        <Card className="border-danger/40 bg-danger/10">
          <CardBody>
            <p className="text-sm text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      {lastOutrightResult != null && (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardBody>
            <p className="text-sm font-medium">Last outright import</p>
            <pre className="mt-2 overflow-x-auto text-xs text-default-600">
              {JSON.stringify(lastOutrightResult, null, 2)}
            </pre>
          </CardBody>
        </Card>
      )}

      {lastResult && (
        <Card className="border-primary/30 bg-primary/5">
          <CardBody>
            <p className="text-sm font-medium">Last action</p>
            <pre className="mt-2 overflow-x-auto text-xs text-default-600">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </CardBody>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Loading fixtures…" />
        </div>
      ) : fixtures.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-default-500">
              No upcoming fixtures returned for this filter. Check
              FOOTBALL_API_KEY in .env or try another competition.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {fixtures.map((f) => (
            <Card key={f.fixtureId} className="border-default-100">
              <CardHeader className="flex flex-wrap items-center justify-between gap-3 pb-0">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {f.home} vs {f.away}
                    </span>
                    <Chip size="sm" variant="flat">
                      {f.leagueName}
                    </Chip>
                    {f.alreadyExists && (
                      <Chip color="warning" size="sm" variant="flat">
                        On-chain
                      </Chip>
                    )}
                  </div>
                  <span className="text-xs text-default-400">
                    #{f.fixtureId} · {formatKickoff(f.kickoffIso)} · {f.status}
                  </span>
                </div>
                <Button
                  color={dryRun ? "default" : "primary"}
                  isDisabled={f.alreadyExists}
                  isLoading={busyId === f.fixtureId}
                  size="sm"
                  onPress={() => void createMarket(f.fixtureId)}
                >
                  {dryRun ? "Preview Market" : "Create Market"}
                </Button>
              </CardHeader>
              <CardBody className="pt-2">
                <p className="text-xs text-default-500 line-clamp-2">
                  {f.prepared.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {f.prepared.outcomes.map((o) => (
                    <Chip
                      key={o.name}
                      className="text-xs"
                      size="sm"
                      variant="bordered"
                    >
                      {o.name}
                    </Chip>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}

          {pagination && pagination.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-sm text-default-500">
                Page {pagination.page} of {pagination.totalPages} ·{" "}
                {pagination.total} fixtures
              </p>
              <div className="flex gap-2">
                <Button
                  isDisabled={!pagination.hasPrevious}
                  size="sm"
                  variant="flat"
                  onPress={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  isDisabled={!pagination.hasNext}
                  size="sm"
                  variant="flat"
                  onPress={() =>
                    setPage((current) =>
                      Math.min(pagination.totalPages, current + 1),
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
