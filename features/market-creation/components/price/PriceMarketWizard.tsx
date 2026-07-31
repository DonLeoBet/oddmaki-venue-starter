"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

import {
  DEFAULT_PRICE_FORM,
  PRICE_WIZARD_STEPS,
  type PriceMarketFormData,
  type PriceWizardStep,
} from "../../types";
import { usePriceMarketCreation } from "../../hooks/usePriceMarketCreation";
import { PYTH_FEED_ID_REGEX } from "../../lib/pythFeeds";
import {
  formatPriceMarketDescription,
  formatPriceMarketTitle,
} from "@/lib/price-market/format-price-market-copy";
import { MarketCreationSuccess } from "../MarketCreationSuccess";
import { WizardLayout } from "../WizardLayout";

import { StepPriceFeed } from "./StepPriceFeed";
import { StepPriceMeta } from "./StepPriceMeta";
import { StepPriceTrading } from "./StepPriceTrading";
import { StepPriceReview } from "./StepPriceReview";
import { StepPriceWindow } from "./StepPriceWindow";

import { TransactionFlowModal } from "@/lib/oddmaki/TransactionFlowModal";

interface PriceMarketWizardProps {
  venueId: bigint;
  creationFee: number;
  onChangeType: () => void;
  onClose?: () => void;
}

// Minimum lead before openTime must be in the future. Just enough that the
// create tx has time to mine before openTime arrives — the protocol itself
// only requires `openTime > block.timestamp` at tx-mine time.
const MIN_SCHEDULED_LEAD_SECONDS = 30;

function resolveTz(value: string): string {
  if (value === "local") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  return value;
}

function tzAbbreviation(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(new Date());

    return parts.find((p) => p.type === "timeZoneName")?.value ?? tz;
  } catch {
    return tz;
  }
}

function toDatetimeLocalInTz(utcMs: number, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function parseDatetimeLocalInTz(value: string, tz: string): number {
  const [datePart, timePart] = value.split("T");

  if (!datePart || !timePart) return 0;
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);
  const naiveUtc = Date.UTC(y, m - 1, d, h, min);
  const formatted = toDatetimeLocalInTz(naiveUtc, tz);
  const [fDate, fTime] = formatted.split("T");
  const [fy, fm, fd] = fDate.split("-").map(Number);
  const [fh, fmin] = fTime.split(":").map(Number);
  const formattedUtc = Date.UTC(fy, fm - 1, fd, fh, fmin);
  const offset = formattedUtc - naiveUtc;

  return naiveUtc - offset;
}

function isValidStrike(form: PriceMarketFormData): boolean {
  if (!form.useStrikePrice) return true;
  const v = Number(form.strikePrice);

  return Number.isFinite(v) && v > 0;
}

function isStepValid(
  step: PriceWizardStep,
  form: PriceMarketFormData,
  openTimeUnix: number | null,
  closeTimeUnix: number | null,
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const openOk =
    form.openMode === "immediate" ||
    (openTimeUnix !== null && openTimeUnix - now >= MIN_SCHEDULED_LEAD_SECONDS);
  const effectiveOpen =
    form.openMode === "immediate" ? now : (openTimeUnix ?? now);
  const closeOk = closeTimeUnix !== null && closeTimeUnix > effectiveOpen;

  switch (step) {
    case "feed":
      return (
        PYTH_FEED_ID_REGEX.test(form.pythFeedId.trim()) && isValidStrike(form)
      );
    case "window":
      return openOk && closeOk;
    case "trading":
      return true;
    case "meta":
      return true;
    case "review":
      return (
        PYTH_FEED_ID_REGEX.test(form.pythFeedId.trim()) &&
        isValidStrike(form) &&
        openOk &&
        closeOk
      );
  }
}

export function PriceMarketWizard({
  venueId,
  creationFee,
  onChangeType,
  onClose,
}: PriceMarketWizardProps) {
  const { address } = useAccount();
  const [formData, setFormData] =
    useState<PriceMarketFormData>(DEFAULT_PRICE_FORM);
  const [currentStep, setCurrentStep] = useState<PriceWizardStep>("feed");
  const [hasCompleted, setHasCompleted] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    if (formData.closeMode !== "preset") return;
    const t = setInterval(() => setTick(Date.now()), 30_000);

    return () => clearInterval(t);
  }, [formData.closeMode]);

  const creation = usePriceMarketCreation(venueId);

  const updateField = useCallback(
    <K extends keyof PriceMarketFormData>(
      key: K,
      value: PriceMarketFormData[K],
    ) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const effectiveTz = useMemo(
    () => resolveTz(formData.customTimezone),
    [formData.customTimezone],
  );
  const openTz = useMemo(
    () => resolveTz(formData.openTimezone),
    [formData.openTimezone],
  );
  const tzAbbr = useMemo(() => tzAbbreviation(effectiveTz), [effectiveTz]);
  const openTzAbbr = useMemo(() => tzAbbreviation(openTz), [openTz]);

  const openTimeUnix = useMemo<number | null>(() => {
    if (formData.openMode === "immediate") return null;
    if (!formData.openDatetime) return null;

    return Math.floor(
      parseDatetimeLocalInTz(formData.openDatetime, openTz) / 1000,
    );
  }, [formData.openMode, formData.openDatetime, openTz]);

  const closeTimeUnix = useMemo<number | null>(() => {
    if (formData.closeMode === "preset") {
      // Preset duration is measured from the market's effective open time —
      // either openTime (scheduled) or now (immediate).
      const base =
        formData.openMode === "scheduled" && openTimeUnix !== null
          ? openTimeUnix
          : Math.floor(tick / 1000);

      return base + formData.presetSeconds;
    }
    if (!formData.customDatetime) return null;

    return Math.floor(
      parseDatetimeLocalInTz(formData.customDatetime, effectiveTz) / 1000,
    );
  }, [
    formData.openMode,
    formData.closeMode,
    formData.presetSeconds,
    formData.customDatetime,
    effectiveTz,
    openTimeUnix,
    tick,
  ]);

  const openDisplay = useMemo<string | null>(() => {
    if (formData.openMode === "immediate") return "Immediately (when tx mines)";
    if (openTimeUnix === null) return null;
    try {
      return (
        new Intl.DateTimeFormat("en-US", {
          timeZone: openTz,
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(openTimeUnix * 1000)) + ` (${openTzAbbr})`
      );
    } catch {
      return new Date(openTimeUnix * 1000).toLocaleString();
    }
  }, [formData.openMode, openTimeUnix, openTz, openTzAbbr]);

  const closeDisplay = useMemo<string | null>(() => {
    if (closeTimeUnix === null) return null;
    try {
      return (
        new Intl.DateTimeFormat("en-US", {
          timeZone: effectiveTz,
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(closeTimeUnix * 1000)) + ` (${tzAbbr})`
      );
    } catch {
      return new Date(closeTimeUnix * 1000).toLocaleString();
    }
  }, [closeTimeUnix, effectiveTz, tzAbbr]);

  // UTC-normalised close-time string for the auto-generated title and
  // description. The on-chain market name is permanent and shown to traders
  // across timezones, so we anchor it to UTC instead of the creator's local
  // clock. The interactive `closeDisplay` above continues to use the picker's
  // chosen timezone — that's only a preview for the creator.
  const closeDisplayUtc = useMemo<string | null>(() => {
    if (closeTimeUnix === null) return null;
    try {
      return (
        new Intl.DateTimeFormat("en-US", {
          timeZone: "UTC",
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(closeTimeUnix * 1000)) + " (UTC)"
      );
    } catch {
      return new Date(closeTimeUnix * 1000).toUTCString();
    }
  }, [closeTimeUnix]);

  const outcomes = useMemo<[string, string]>(
    () => (formData.useStrikePrice ? ["Above", "Below"] : ["Up", "Down"]),
    [formData.useStrikePrice],
  );

  const autoTitle = useMemo(() => {
    if (!closeDisplayUtc) return "";

    return formatPriceMarketTitle({
      feedSymbol: formData.feedSymbol,
      feedId: formData.pythFeedId,
      expiryTimeUtc: closeDisplayUtc,
      useStrikePrice: formData.useStrikePrice,
      strikePrice: Number(formData.strikePrice),
    });
  }, [
    formData.feedSymbol,
    formData.pythFeedId,
    formData.useStrikePrice,
    formData.strikePrice,
    closeDisplayUtc,
  ]);

  const autoDescription = useMemo(() => {
    if (!closeDisplayUtc) return "";

    return formatPriceMarketDescription({
      feedSymbol: formData.feedSymbol,
      feedId: formData.pythFeedId,
      expiryTimeUtc: closeDisplayUtc,
      useStrikePrice: formData.useStrikePrice,
      strikePrice: Number(formData.strikePrice),
    });
  }, [
    formData.feedSymbol,
    formData.pythFeedId,
    formData.useStrikePrice,
    formData.strikePrice,
    closeDisplayUtc,
  ]);

  const stepIndex = PRICE_WIZARD_STEPS.findIndex((s) => s.id === currentStep);
  const totalSteps = PRICE_WIZARD_STEPS.length;
  const stepInfo = PRICE_WIZARD_STEPS[stepIndex];
  const valid = useMemo(
    () => isStepValid(currentStep, formData, openTimeUnix, closeTimeUnix),
    [currentStep, formData, openTimeUnix, closeTimeUnix],
  );

  const goNext = useCallback(() => {
    const next = PRICE_WIZARD_STEPS[stepIndex + 1];

    if (next) setCurrentStep(next.id);
  }, [stepIndex]);

  const goBack = useCallback(() => {
    const prev = PRICE_WIZARD_STEPS[stepIndex - 1];

    if (prev) setCurrentStep(prev.id);
  }, [stepIndex]);

  const submit = useCallback(() => {
    if (!address || closeTimeUnix === null) return;
    // Immediate markets send openTime=0 (contract sets it to block.timestamp).
    // Scheduled markets send the user-picked unix time.
    const openTimeUnixToSend =
      formData.openMode === "immediate" ? 0 : openTimeUnix;

    if (formData.openMode === "scheduled" && openTimeUnixToSend === null)
      return;
    setHasCompleted(true);
    setFlowOpen(true);
    creation.createPriceMarket(
      formData,
      {
        openTimeUnix: openTimeUnixToSend ?? 0,
        closeTimeUnix,
        outcomes,
        title: formData.title.trim() || autoTitle,
        description: formData.description.trim() || autoDescription,
      },
      address,
    );
  }, [
    address,
    autoDescription,
    autoTitle,
    closeTimeUnix,
    creation,
    formData,
    openTimeUnix,
    outcomes,
  ]);

  const reset = useCallback(() => {
    setFormData(DEFAULT_PRICE_FORM);
    setCurrentStep("feed");
    setHasCompleted(false);
    setFlowOpen(false);
    creation.reset();
  }, [creation]);

  const handleFlowClose = useCallback(() => {
    setFlowOpen(false);
    if (!creation.isComplete) {
      creation.reset();
      setHasCompleted(false);
    }
  }, [creation]);

  if (hasCompleted && creation.isComplete && !flowOpen) {
    return (
      <MarketCreationSuccess
        marketTitle={formData.title.trim() || autoTitle}
        marketType="price"
        onClose={onClose}
        onCreateAnother={() => {
          reset();
          onChangeType();
        }}
      />
    );
  }

  return (
    <>
      <WizardLayout
        canGoBack={stepIndex > 0}
        canGoNext={valid}
        invalidHint={
          currentStep === "window"
            ? formData.openMode === "scheduled" && !formData.openDatetime
              ? "Pick a future open time"
              : "Close time must be strictly after the open time"
            : "Complete required fields to continue"
        }
        isLastStep={stepIndex === totalSteps - 1}
        isSubmitting={creation.isRunning}
        step={stepInfo}
        stepIndex={stepIndex}
        submitLabel="Create price market"
        totalSteps={totalSteps}
        onBack={goBack}
        onNext={goNext}
        onSubmit={submit}
      >
        {currentStep === "feed" && (
          <StepPriceFeed formData={formData} updateField={updateField} />
        )}
        {currentStep === "window" && (
          <StepPriceWindow formData={formData} updateField={updateField} />
        )}
        {currentStep === "meta" && (
          <StepPriceMeta
            autoDescription={autoDescription}
            autoTitle={autoTitle}
            formData={formData}
            updateField={updateField}
          />
        )}
        {currentStep === "trading" && (
          <StepPriceTrading formData={formData} updateField={updateField} />
        )}
        {currentStep === "review" && (
          <StepPriceReview
            closeDisplay={closeDisplay}
            creationFee={creationFee}
            formData={formData}
            openDisplay={openDisplay}
            outcomes={outcomes}
            resolvedDescription={formData.description.trim() || autoDescription}
            resolvedTitle={formData.title.trim() || autoTitle}
          />
        )}
      </WizardLayout>

      <TransactionFlowModal
        hasError={creation.hasError}
        isComplete={creation.isComplete}
        isOpen={flowOpen}
        isRunning={creation.isRunning}
        stepStates={creation.stepStates}
        title="Create price market"
        onClose={handleFlowClose}
        onRetry={creation.retry}
      />
    </>
  );
}
