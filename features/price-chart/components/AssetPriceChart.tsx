"use client";

import type { ChartDataPoint } from "../lib/aggregation";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  CrosshairMode,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type MouseEventParams,
} from "lightweight-charts";

import { colors, alpha } from "@/lib/tokens";

interface AssetPriceChartProps {
  data: ChartDataPoint[];
  currentPrice?: number;
  /** Strike / reference price — shown as a dashed horizontal line */
  strikePrice?: number;
  /**
   * Close price (asset price at the market's closeTime). When provided — i.e.
   * the market has expired — it's drawn as a solid horizontal line so viewers
   * see where the market settled relative to the target.
   */
  closePrice?: number;
  /** Feed symbol for tooltip label, e.g., "BTC/USD" */
  feedSymbol?: string;
  height?: number;
}

function formatDollar(price: number): string {
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTimeLabel(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export const AssetPriceChart = memo(function AssetPriceChart({
  data,
  currentPrice,
  strikePrice,
  closePrice,
  feedSymbol = "",
  height = 300,
}: AssetPriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const seriesRef = useRef<ISeriesApi<any> | null>(null);

  const markersRef = useRef<ISeriesMarkersPluginApi<any> | null>(null);

  // Kept fresh for the autoscaleInfoProvider closure so the vertical axis
  // always spans the current/close price and the target (strike) line, even
  // when they sit outside the recent price-history range.
  const strikeRef = useRef<number | undefined>(strikePrice);
  const currentPriceRef = useRef<number | undefined>(currentPrice);
  const closeRef = useRef<number | undefined>(closePrice);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    price: number;
  }>({ visible: false, x: 0, y: 0, price: 0 });

  const handleCrosshairMove = useCallback((param: MouseEventParams) => {
    if (!param.point || !seriesRef.current) {
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));

      return;
    }

    const seriesData = param.seriesData?.get(seriesRef.current);

    if (!seriesData || !("value" in seriesData)) {
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));

      return;
    }

    const value = (seriesData as any).value as number;

    setTooltip({
      visible: true,
      x: param.point.x,
      y: param.point.y,
      price: value,
    });
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
      },
      width: containerRef.current.clientWidth,
      height,
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: alpha(colors.neonCyan, 0.3),
          width: 1,
          style: 0,
          labelVisible: false,
        },
        horzLine: {
          color: alpha(colors.neonCyan, 0.3),
          width: 1,
          style: 0,
          labelVisible: true,
          labelBackgroundColor: colors.neonCyan,
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
        fixLeftEdge: true,
        rightOffset: 3,
      },
      handleScroll: false,
      handleScale: false,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: colors.neonCyan,
      lineWidth: 3,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => formatDollar(price),
        minMove: 0.01,
      },
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: colors.neonCyan,
      crosshairMarkerBackgroundColor: colors.neonCyan,
      crosshairMarkerBorderWidth: 2,
      // Extend the auto-computed price range so the target line and the
      // current price are always within the visible vertical axis.
      autoscaleInfoProvider: (original: () => any) => {
        const res = original();
        const extras = [
          strikeRef.current,
          currentPriceRef.current,
          closeRef.current,
        ].filter((v): v is number => v !== undefined && Number.isFinite(v));

        if (extras.length === 0) return res;

        const base = res?.priceRange;
        let minValue = base ? base.minValue : extras[0];
        let maxValue = base ? base.maxValue : extras[0];

        for (const v of extras) {
          minValue = Math.min(minValue, v);
          maxValue = Math.max(maxValue, v);
        }

        return { ...res, priceRange: { minValue, maxValue } };
      },
    });

    const markers = createSeriesMarkers(lineSeries, []);

    chartRef.current = chart;
    seriesRef.current = lineSeries;
    markersRef.current = markers;

    // Hide TradingView branding watermark
    const branding = containerRef.current.querySelector(
      'a[href*="tradingview"]',
    ) as HTMLElement | null;

    if (branding) branding.style.display = "none";

    chart.subscribeCrosshairMove(handleCrosshairMove);

    const container = containerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry && chartRef.current) {
        chartRef.current.applyOptions({
          width: entry.contentRect.width,
        });
      }
    });

    resizeObserver.observe(container);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      markers.detach();
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, [height, handleCrosshairMove]);

  // Update data when it changes
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    // Refresh the values the autoscaleInfoProvider reads before setData
    // triggers a price-scale recalculation.
    strikeRef.current = strikePrice;
    currentPriceRef.current = currentPrice;
    closeRef.current = closePrice;

    // lightweight-charts requires the series strictly ascending and unique by
    // time. Defensively sort and collapse duplicate timestamps (keeping the
    // latest value) so no upstream source can crash the chart with a stray
    // out-of-order or repeated point.
    const sorted = data
      .map((d) => ({ time: Number(d.time), value: d.value }))
      .sort((a, b) => a.time - b.time);
    const ascending: { time: number; value: number }[] = [];

    for (const p of sorted) {
      const prev = ascending[ascending.length - 1];

      if (prev && prev.time === p.time) ascending[ascending.length - 1] = p;
      else ascending.push(p);
    }

    seriesRef.current.setData(
      ascending.map((d) => ({
        time: d.time as any,
        value: d.value,
      })),
    );

    // Current price dot at the last data point
    if (markersRef.current) {
      if (currentPrice !== undefined && ascending.length > 0) {
        const lastPoint = ascending[ascending.length - 1];

        markersRef.current.setMarkers([
          {
            time: lastPoint.time as any,
            position: "inBar",
            shape: "circle",
            color: colors.neonCyan,
            size: 1,
          },
        ]);
      } else {
        markersRef.current.setMarkers([]);
      }
    }

    // Horizontal reference lines: Target (strike) and, once expired, Close.
    if (seriesRef.current) {
      // Remove existing price lines first
      const existing = seriesRef.current.priceLines();

      for (const line of existing) {
        seriesRef.current.removePriceLine(line);
      }

      if (strikePrice !== undefined) {
        seriesRef.current.createPriceLine({
          price: strikePrice,
          color: colors.neonMagenta,
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: "Target",
        });
      }

      if (closePrice !== undefined) {
        seriesRef.current.createPriceLine({
          price: closePrice,
          color: colors.neonBlue,
          lineWidth: 2,
          lineStyle: 0, // Solid
          axisLabelVisible: true,
          title: "Close",
        });
      }
    }

    // Time axis formatting for live data (always show time)
    chartRef.current.applyOptions({
      timeScale: {
        tickMarkFormatter: (time: any) => formatTimeLabel(time as number),
      },
    });

    if (data.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data, currentPrice, strikePrice, closePrice]);

  return (
    <div ref={containerRef} className="w-full relative">
      {tooltip.visible && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: tooltip.x,
            top: tooltip.y - 32,
            transform: "translateX(-50%)",
          }}
        >
          <div
            className="px-2 py-1 rounded text-xs font-semibold whitespace-nowrap"
            style={{
              backgroundColor: alpha(colors.neonCyan, 0.15),
              color: colors.neonCyan,
              border: `1px solid ${alpha(colors.neonCyan, 0.3)}`,
            }}
          >
            {feedSymbol ? `${feedSymbol} ` : ""}
            {formatDollar(tooltip.price)}
          </div>
        </div>
      )}
    </div>
  );
});
