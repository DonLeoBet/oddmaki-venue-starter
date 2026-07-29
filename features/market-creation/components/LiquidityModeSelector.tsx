"use client";

import type { LiquidityMode } from "../types";

import { LIQUIDITY_MODES } from "../types";

import { colors, fonts } from "@/lib/tokens";

interface LiquidityModeSelectorProps {
  value: LiquidityMode;
  onChange: (mode: LiquidityMode) => void;
}

/**
 * Two-option selector for the market's liquidity mechanism.
 * Mirrors the tick-size button selector with the brand cyan accent.
 * Defaults to Order Book.
 */
export function LiquidityModeSelector({
  value,
  onChange,
}: LiquidityModeSelectorProps) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "#cfcfcf",
          marginBottom: 8,
          fontFamily: fonts.sans,
          fontWeight: 500,
        }}
      >
        Liquidity Mode <span style={{ color: colors.neonCyan }}>*</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: 8,
        }}
      >
        {LIQUIDITY_MODES.map((opt) => {
          const selected = value === opt.id;

          return (
            <button
              key={opt.id}
              style={{
                padding: "12px 14px",
                background: selected ? `${colors.neonCyan}14` : "transparent",
                border: `1px solid ${selected ? `${colors.neonCyan}66` : "#ffffff14"}`,
                borderRadius: 8,
                color: selected ? "white" : "#bbb",
                fontSize: 12,
                fontFamily: fonts.sans,
                cursor: "pointer",
                textAlign: "left",
              }}
              type="button"
              onClick={() => onChange(opt.id)}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                {opt.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: selected ? "#ddd" : "#9a9a9a",
                  lineHeight: 1.5,
                  marginBottom: 4,
                }}
              >
                {opt.description}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: selected ? "#b9b9b9" : "#8c8c8c",
                }}
              >
                {opt.finePrint}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
