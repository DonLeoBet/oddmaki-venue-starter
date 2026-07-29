"use client";

import type { StandardMarketFormData, TickSize } from "../../types";

import { Field, inputStyle } from "../Field";
import { LiquidityModeSelector } from "../LiquidityModeSelector";

import { colors, fonts } from "@/lib/tokens";

interface StepStandardTradingProps {
  formData: StandardMarketFormData;
  updateField: <K extends keyof StandardMarketFormData>(
    key: K,
    value: StandardMarketFormData[K],
  ) => void;
}

const TICK_OPTIONS: { value: TickSize; label: string; description: string }[] =
  [
    {
      value: "0.01",
      label: "$0.01 (1%)",
      description: "100 price levels — standard.",
    },
    {
      value: "0.001",
      label: "$0.001 (0.1%)",
      description: "1,000 price levels — fine-grained.",
    },
  ];

const labelStyle = {
  fontSize: 12,
  color: "#cfcfcf",
  marginBottom: 8,
  fontFamily: fonts.sans,
  fontWeight: 500,
} as const;

const hintStyle = {
  fontSize: 11,
  color: "#9a9a9a",
  marginBottom: 10,
  fontFamily: fonts.sans,
  lineHeight: 1.5,
} as const;

export function StepStandardTrading({
  formData,
  updateField,
}: StepStandardTradingProps) {
  const isPool = formData.liquidityMode === "pool";

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <LiquidityModeSelector
        value={formData.liquidityMode}
        onChange={(mode) => updateField("liquidityMode", mode)}
      />

      {isPool ? (
        <>
          {/* Open time: immediate vs scheduled (mirrors price markets). */}
          <div>
            <div style={labelStyle}>
              Open time <span style={{ color: colors.neonCyan }}>*</span>
            </div>
            <div style={hintStyle}>
              When the pool opens for dynamic pricing. Immediate opens when the
              create tx mines. Scheduled adds a pre-open lobby where traders
              place refundable intent stakes until the open time.
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 12,
              }}
            >
              {(["immediate", "scheduled"] as const).map((mode) => {
                const selected = formData.openMode === mode;

                return (
                  <button
                    key={mode}
                    style={{
                      padding: "8px 14px",
                      background: selected
                        ? `${colors.neonCyan}14`
                        : "transparent",
                      border: `1px solid ${selected ? `${colors.neonCyan}66` : "#ffffff14"}`,
                      borderRadius: 8,
                      color: selected ? "white" : "#bbb",
                      fontSize: 12,
                      fontFamily: fonts.sans,
                      cursor: "pointer",
                    }}
                    type="button"
                    onClick={() => updateField("openMode", mode)}
                  >
                    {mode === "immediate" ? "Immediate" : "Scheduled"}
                  </button>
                );
              })}
            </div>

            {formData.openMode === "scheduled" && (
              <Field
                required
                hint="Must be in the future. Wall clock in your local timezone."
                label="Opens at"
              >
                <input
                  style={inputStyle}
                  type="datetime-local"
                  value={formData.openDatetime}
                  onChange={(e) => updateField("openDatetime", e.target.value)}
                />
              </Field>
            )}
          </div>

          {/* Close time: a specific date. */}
          <Field
            required
            hint="When the pool stops accepting entries. Must be after the open time."
            label="Close time"
          >
            <input
              style={inputStyle}
              type="datetime-local"
              value={formData.closeDatetime}
              onChange={(e) => updateField("closeDatetime", e.target.value)}
            />
          </Field>
        </>
      ) : (
        <div>
          <div style={labelStyle}>
            Tick size <span style={{ color: colors.neonCyan }}>*</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
              gap: 8,
            }}
          >
            {TICK_OPTIONS.map((opt) => {
              const selected = formData.tickSize === opt.value;

              return (
                <button
                  key={opt.value}
                  style={{
                    padding: "10px 14px",
                    background: selected
                      ? `${colors.neonCyan}14`
                      : "transparent",
                    border: `1px solid ${selected ? `${colors.neonCyan}66` : "#ffffff14"}`,
                    borderRadius: 8,
                    color: selected ? "white" : "#bbb",
                    fontSize: 12,
                    fontFamily: fonts.sans,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  type="button"
                  onClick={() => updateField("tickSize", opt.value)}
                >
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: selected ? "#ddd" : "#9a9a9a",
                    }}
                  >
                    {opt.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
