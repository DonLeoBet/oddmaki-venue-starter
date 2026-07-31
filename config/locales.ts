/**
 * Supported UI locales for market labels and brand copy.
 * Extend this list when adding new country/region brands.
 */
export const CORE_LOCALES = [
  "en",
  "nl",
  "de",
  "es",
  "fr",
  "it",
  "pt",
  "tr",
  "id",
  "th",
  "vi",
] as const;

export const ADDITIONAL_LOCALES = [
  "ru",
  "pt-BR",
  "zh",
  "ja",
  "ko",
  "ar",
  "hi",
  "bn",
  "ur",
  "fa",
  "pl",
  "el",
  "sv",
  "no",
  "da",
  "fi",
] as const;

export const ALL_SUPPORTED_LOCALES = [
  ...CORE_LOCALES,
  ...ADDITIONAL_LOCALES,
] as const;

export type Locale = (typeof ALL_SUPPORTED_LOCALES)[number];

/** @deprecated Use Locale */
export type SupportedLang = Locale;

export function isLocale(value: string): value is Locale {
  return (ALL_SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(
  raw: string | undefined,
  fallback: Locale = "en",
): Locale {
  if (raw && isLocale(raw)) return raw;
  return fallback;
}

export const COMMON_OUTCOME_LABELS: Record<
  Locale,
  { yes: string; no: string }
> = {
  en: { yes: "Yes", no: "No" },
  nl: { yes: "Ja", no: "Nee" },
  de: { yes: "Ja", no: "Nein" },
  es: { yes: "Sí", no: "No" },
  fr: { yes: "Oui", no: "Non" },
  it: { yes: "Sì", no: "No" },
  pt: { yes: "Sim", no: "Não" },
  tr: { yes: "Evet", no: "Hayır" },
  id: { yes: "Ya", no: "Tidak" },
  th: { yes: "ใช่", no: "ไม่" },
  vi: { yes: "Có", no: "Không" },
  ru: { yes: "Да", no: "Нет" },
  "pt-BR": { yes: "Sim", no: "Não" },
  zh: { yes: "是", no: "否" },
  ja: { yes: "はい", no: "いいえ" },
  ko: { yes: "예", no: "아니오" },
  ar: { yes: "نعم", no: "لا" },
  hi: { yes: "हाँ", no: "नहीं" },
  bn: { yes: "হ্যাঁ", no: "না" },
  ur: { yes: "ہاں", no: "نہیں" },
  fa: { yes: "بله", no: "خیر" },
  pl: { yes: "Tak", no: "Nie" },
  el: { yes: "Ναι", no: "Όχι" },
  sv: { yes: "Ja", no: "Nej" },
  no: { yes: "Ja", no: "Nei" },
  da: { yes: "Ja", no: "Nej" },
  fi: { yes: "Kyllä", no: "Ei" },
};

export function getCommonYesNo(locale: Locale): { yes: string; no: string } {
  return COMMON_OUTCOME_LABELS[locale] ?? COMMON_OUTCOME_LABELS.en;
}
