"use client";

import type { PriceMarketFormData } from "../../types";

import { Field, inputStyle } from "../Field";
import { TagsInput } from "../TagsInput";

interface StepPriceMetaProps {
  formData: PriceMarketFormData;
  updateField: <K extends keyof PriceMarketFormData>(
    key: K,
    value: PriceMarketFormData[K],
  ) => void;
  autoTitle: string;
  autoDescription: string;
}

export function StepPriceMeta({
  formData,
  updateField,
  autoTitle,
  autoDescription,
}: StepPriceMetaProps) {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <Field
        required
        hint={
          autoTitle && !formData.title.trim()
            ? `Will use auto-generated: ${autoTitle}`
            : "How traders see this market in feeds."
        }
        label="Title"
      >
        <input
          maxLength={240}
          placeholder={autoTitle || "ETH/USD Above/Below $4,000"}
          style={inputStyle}
          type="text"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
        />
      </Field>

      <Field
        hint={
          autoDescription && !formData.description.trim()
            ? `Will use auto-generated: ${autoDescription}`
            : "Optional resolution criteria. Pyth resolution is automatic — this is for traders."
        }
        label="Description"
      >
        <textarea
          placeholder={
            autoDescription ||
            "Resolves Above if Pyth ETH/USD ≥ $4,000 at close time."
          }
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
      </Field>

      <Field
        hint="Optional categorization. Surfaced in feeds and explorers."
        label="Tags"
      >
        <div style={{ marginTop: 0 }}>
          <TagsInput
            tags={formData.tags}
            onChange={(t) => updateField("tags", t)}
          />
        </div>
      </Field>
    </div>
  );
}
