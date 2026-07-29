"use client";

import type { IChartApi, ISeriesApi, UTCTimestamp } from "lightweight-charts";

import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineSeries,
} from "lightweight-charts";
import { Skeleton } from "@heroui/skeleton";

import { useDpmOddsSeries } from "../hooks/useDpmOddsSeries";

import { colors } from "@/lib/tokens";

const LINE_COLORS = [
  colors.neonCyan,
  colors.neonMagenta,
  "#4D7CFF",
  "#FACC15",
  "#22C55E",
  "#F472B6",
  "#A78BFA",
  "#FB923C",
];

interface DpmProbabilityChartProps {
  marketId: string;
  outcomes: string[];
  height?: number;
}

/**
 * Implied-odds chart for a Pool market — one line per outcome (its share of the
 * pool over time), from the per-entry snapshots. Multi-outcome ready.
 */
export function DpmProbabilityChart({
  marketId,
  outcomes,
  height = 300,
}: DpmProbabilityChartProps) {
  const { data: series, isLoading } = useDpmOddsSeries(marketId);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line">[]>([]);

  // One sorted + deduped { time, value(0–1) } line per outcome.
  const lines = useMemo(() => {
    const pts = series ?? [];

    return outcomes.map((label, i) => {
      const raw = pts
        .map((p) => ({ time: p.time, value: (p.pcts[i] ?? 0) / 100 }))
        .sort((a, b) => a.time - b.time);
      const data: { time: number; value: number }[] = [];

      for (const p of raw) {
        const prev = data[data.length - 1];

        if (prev && prev.time === p.time) data[data.length - 1] = p;
        else data.push(p);
      }

      return { label, color: LINE_COLORS[i % LINE_COLORS.length], data };
    });
  }, [series, outcomes]);

  // Create the chart once.
  useEffect(() => {
    const el = containerRef.current;

    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
      },
      width: el.clientWidth,
      height,
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      crosshair: { mode: CrosshairMode.Magnet },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 3,
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
    });

    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = [];
    };
  }, [height]);

  // Rebuild the lines whenever the data (or outcome set) changes.
  useEffect(() => {
    const chart = chartRef.current;

    if (!chart) return;

    for (const s of seriesRef.current) chart.removeSeries(s);
    seriesRef.current = [];

    for (const line of lines) {
      const s = chart.addSeries(LineSeries, {
        color: line.color,
        lineWidth: 2,
        priceFormat: {
          type: "custom",
          formatter: (v: number) => `${Math.round(v * 100)}%`,
          minMove: 0.01,
        },
      });

      s.setData(
        line.data.map((d) => ({
          time: d.time as UTCTimestamp,
          value: d.value,
        })),
      );
      seriesRef.current.push(s);
    }

    chart.timeScale().fitContent();
  }, [lines]);

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full rounded-lg" />;
  }

  if (!series || series.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-default-400">
        No pool activity yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} style={{ width: "100%", height }} />
      <div className="flex flex-wrap gap-3 px-1">
        {lines.map((l) => (
          <div
            key={l.label}
            className="flex items-center gap-1.5 text-xs text-default-500"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: l.color }}
            />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
