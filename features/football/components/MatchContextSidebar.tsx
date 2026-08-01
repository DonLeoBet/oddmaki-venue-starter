"use client";

import type {
  H2HMatchResult,
  MatchPageContext,
  RecentMatchResult,
  TeamFormBlock,
} from "@/lib/football/match-page-context";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";

import { TeamLogo } from "@/components/football/TeamLogo";
import { useMatchFootballContext } from "@/features/football/hooks/useMatchFootballContext";
import { alpha, colors } from "@/lib/tokens";

interface MatchContextSidebarProps {
  groupTags: string[] | undefined;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

function FormBadges({ form }: { form: string | null }) {
  if (!form) return null;

  return (
    <div className="flex gap-0.5">
      {form.slice(0, 5).split("").map((letter, index) => {
        const tone =
          letter === "W" ? "bg-emerald-500/20 text-emerald-400"
          : letter === "D" ? "bg-default-200/60 text-default-400"
          : "bg-danger/15 text-danger";

        return (
          <span
            key={`${letter}-${index}`}
            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${tone}`}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
}

function RecentMatchRow({
  match,
  accent,
}: {
  match: RecentMatchResult;
  accent: string;
}) {
  const opponent =
    match.isHomeTeam ? match.awayTeamName : match.homeTeamName;
  const score = `${match.homeGoals}-${match.awayGoals}`;
  const prefix = match.isHomeTeam ? "vs" : "@";

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-[11px]">
      <span className="text-default-400 tabular-nums shrink-0">
        {formatShortDate(match.date)}
      </span>
      <span className="truncate text-default-500 flex-1">
        {prefix} {opponent}
      </span>
      <span className="font-semibold tabular-nums shrink-0" style={{ color: accent }}>
        {score}
      </span>
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold shrink-0 ${
          match.result === "W" ? "bg-emerald-500/20 text-emerald-400"
          : match.result === "D" ? "bg-default-200/60 text-default-400"
          : "bg-danger/15 text-danger"
        }`}
      >
        {match.result}
      </span>
    </div>
  );
}

function H2HMatchRow({
  match,
  context,
}: {
  match: H2HMatchResult;
  context: MatchPageContext;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-[11px] border-b border-default-100/40 last:border-0">
      <span className="text-default-400 tabular-nums shrink-0 w-14">
        {formatShortDate(match.date)}
      </span>
      <span className="truncate flex-1 text-default-500">
        {match.homeTeamName} {match.homeGoals}-{match.awayGoals} {match.awayTeamName}
      </span>
    </div>
  );
}

function StandingsTable({ context }: { context: MatchPageContext }) {
  if (context.standings.length === 0) return null;

  const seasonLabel =
    context.standingsSeason !== context.season ?
      `${context.leagueName} ${context.standingsSeason}/${String(context.standingsSeason + 1).slice(-2)}`
    : `${context.leagueName} standings`;

  return (
    <Card className="border border-default-100/50">
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold">{seasonLabel}</h3>
        {context.standingsSeason === context.season &&
          context.standings.every((row) => row.played === 0) && (
            <p className="text-[11px] text-default-400 font-normal">
              Season started — table updates as results come in.
            </p>
          )}
      </CardHeader>
      <CardBody className="pt-0 px-0 pb-2">
        <div className="max-h-72 overflow-y-auto [scrollbar-width:thin]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-content1 text-default-400">
              <tr>
                <th className="px-3 py-1 text-left font-medium">#</th>
                <th className="px-2 py-1 text-left font-medium">Team</th>
                <th className="px-2 py-1 text-center font-medium">P</th>
                <th className="px-2 py-1 text-center font-medium">L</th>
                <th className="px-3 py-1 text-right font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {context.standings.map((row) => {
                const isHome = row.teamId === context.homeTeamId;
                const isAway = row.teamId === context.awayTeamId;
                const highlight =
                  isHome ? alpha(colors.neonCyan, 0.12)
                  : isAway ? alpha(colors.neonMagenta, 0.12)
                  : undefined;

                return (
                  <tr key={row.teamId} style={{ backgroundColor: highlight }}>
                    <td className="px-3 py-1.5 tabular-nums text-default-400">
                      {row.rank}
                    </td>
                    <td
                      className="px-2 py-1.5 font-medium truncate max-w-[120px]"
                      style={{
                        color:
                          isHome ? colors.neonCyan
                          : isAway ? colors.neonMagenta
                          : undefined,
                      }}
                    >
                      {row.teamName}
                    </td>
                    <td className="px-2 py-1.5 text-center tabular-nums">
                      {row.played}
                    </td>
                    <td className="px-2 py-1.5 text-center tabular-nums text-default-400">
                      {row.lost}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function H2HCard({ context }: { context: MatchPageContext }) {
  if (!context.h2h || context.h2h.total === 0) return null;

  return (
    <Card className="border border-default-100/50">
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold">Head-to-head</h3>
      </CardHeader>
      <CardBody className="pt-0 gap-3">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-primary/10 py-2">
            <span className="block text-default-400">{context.homeTeamName}</span>
            <span className="text-lg font-bold text-primary tabular-nums">
              {context.h2h.homeWins}
            </span>
          </div>
          <div className="rounded-lg bg-default-100/40 py-2">
            <span className="block text-default-400">Draws</span>
            <span className="text-lg font-bold tabular-nums">{context.h2h.draws}</span>
          </div>
          <div className="rounded-lg bg-secondary/10 py-2">
            <span className="block text-default-400">{context.awayTeamName}</span>
            <span className="text-lg font-bold text-secondary tabular-nums">
              {context.h2h.awayWins}
            </span>
          </div>
        </div>
        {context.h2hMatches.length > 0 && (
          <div className="rounded-lg border border-default-100/50 px-3 py-1">
            {context.h2hMatches.map((match) => (
              <H2HMatchRow
                key={`${match.date}-${match.homeTeamId}-${match.awayTeamId}`}
                context={context}
                match={match}
              />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function TeamFormCard({
  block,
  accent,
  label,
}: {
  block: TeamFormBlock;
  accent: string;
  label: "Home" | "Away";
}) {
  return (
    <Card className="border border-default-100/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 w-full">
          <TeamLogo name={block.teamName} size="sm" src={block.logoUrl} />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] uppercase tracking-wide text-default-400">
              {label}
            </span>
            <h3 className="text-sm font-semibold truncate" style={{ color: accent }}>
              {block.teamName}
            </h3>
          </div>
          <FormBadges form={block.form} />
        </div>
      </CardHeader>
      {block.recentMatches.length > 0 && (
        <CardBody className="pt-0 px-3 pb-3">
          <p className="text-[10px] text-default-400 mb-1">Last matches</p>
          {block.recentMatches.map((match) => (
            <RecentMatchRow
              key={`${match.date}-${match.homeTeamId}-${match.awayTeamId}`}
              accent={accent}
              match={match}
            />
          ))}
        </CardBody>
      )}
    </Card>
  );
}

function BookmakerOdds({ context }: { context: MatchPageContext }) {
  if (context.bookmakerOdds.length === 0) return null;

  return (
    <Card className="border border-default-100/50">
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold">Bookmaker 1X2 (reference)</h3>
        <p className="text-[11px] text-default-400 font-normal">
          External odds from API-Football when available — not Poly.Football prices.
        </p>
      </CardHeader>
      <CardBody className="pt-0 gap-2">
        {context.bookmakerOdds.slice(0, 3).map((row) => (
          <div
            key={row.bookmaker}
            className="rounded-lg border border-default-100/60 px-3 py-2"
          >
            <p className="text-[11px] text-default-400 mb-1">{row.bookmaker}</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="block text-default-400">Home</span>
                <span className="font-semibold text-primary tabular-nums">
                  {row.home ?? "–"}
                </span>
              </div>
              <div>
                <span className="block text-default-400">Draw</span>
                <span className="font-semibold tabular-nums">{row.draw ?? "–"}</span>
              </div>
              <div>
                <span className="block text-default-400">Away</span>
                <span className="font-semibold text-secondary tabular-nums">
                  {row.away ?? "–"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

/** Standings, H2H, form + reference odds under the resolution panel. */
export function MatchContextSidebar({ groupTags }: MatchContextSidebarProps) {
  const { data, isLoading, isError } = useMatchFootballContext(groupTags);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="sm" />
      </div>
    );
  }

  if (isError || !data) return null;

  return (
    <div className="flex flex-col gap-4">
      <StandingsTable context={data} />
      <H2HCard context={data} />
      {data.homeForm && (
        <TeamFormCard
          accent={colors.neonCyan}
          block={data.homeForm}
          label="Home"
        />
      )}
      {data.awayForm && (
        <TeamFormCard
          accent={colors.neonMagenta}
          block={data.awayForm}
          label="Away"
        />
      )}
      <BookmakerOdds context={data} />
    </div>
  );
}
