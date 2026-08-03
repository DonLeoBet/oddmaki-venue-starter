/** Map nationality/adjective tags to proper country names for sidebar display. */
const COUNTRY_LABEL_OVERRIDES: Record<string, string> = {
  Algerian: "Algeria",
  Argentine: "Argentina",
  Australian: "Australia",
  Austrian: "Austria",
  Belgian: "Belgium",
  Bolivian: "Bolivia",
  Brazilian: "Brazil",
  Bulgarian: "Bulgaria",
  Cameroonian: "Cameroon",
  Canadian: "Canada",
  Chilean: "Chile",
  Chinese: "China",
  Colombian: "Colombia",
  Croatian: "Croatia",
  Czech: "Czech Republic",
  Danish: "Denmark",
  Dutch: "Netherlands",
  Ecuadorian: "Ecuador",
  Egyptian: "Egypt",
  English: "England",
  Finnish: "Finland",
  French: "France",
  German: "Germany",
  Ghanaian: "Ghana",
  Greek: "Greece",
  Guatemalan: "Guatemala",
  Honduran: "Honduras",
  Hungarian: "Hungary",
  Indian: "India",
  Indonesian: "Indonesia",
  Irish: "Ireland",
  Israeli: "Israel",
  Italian: "Italy",
  Japanese: "Japan",
  Kazakh: "Kazakhstan",
  Kenyan: "Kenya",
  Korean: "South Korea",
  Mexican: "Mexico",
  Moroccan: "Morocco",
  Nigerian: "Nigeria",
  Norwegian: "Norway",
  Paraguayan: "Paraguay",
  Peruvian: "Peru",
  Polish: "Poland",
  Portuguese: "Portugal",
  Qatari: "Qatar",
  Romanian: "Romania",
  Russian: "Russia",
  Saudi: "Saudi Arabia",
  Scottish: "Scotland",
  Serbian: "Serbia",
  Slovak: "Slovakia",
  Slovenian: "Slovenia",
  "South African": "South Africa",
  "South American": "South America",
  Spanish: "Spain",
  Swedish: "Sweden",
  Swiss: "Switzerland",
  Thai: "Thailand",
  Tunisian: "Tunisia",
  Turkish: "Turkey",
  UAE: "United Arab Emirates",
  Ukrainian: "Ukraine",
  Uruguayan: "Uruguay",
  US: "United States",
  Venezuelan: "Venezuela",
  Vietnamese: "Vietnam",
  Welsh: "Wales",
  European: "Europe",
  International: "International",
};

/** ISO 3166-1 alpha-2 (or special) for flag helpers — keyed by country slug. */
const COUNTRY_FLAG_CODE: Record<string, string> = {
  algeria: "dz",
  argentina: "ar",
  australia: "au",
  austria: "at",
  belgium: "be",
  bolivia: "bo",
  brazil: "br",
  bulgaria: "bg",
  cameroon: "cm",
  canada: "ca",
  chile: "cl",
  china: "cn",
  colombia: "co",
  croatia: "hr",
  "czech-republic": "cz",
  denmark: "dk",
  netherlands: "nl",
  ecuador: "ec",
  egypt: "eg",
  england: "gb-eng",
  finland: "fi",
  france: "fr",
  germany: "de",
  ghana: "gh",
  greece: "gr",
  guatemala: "gt",
  honduras: "hn",
  hungary: "hu",
  india: "in",
  indonesia: "id",
  ireland: "ie",
  israel: "il",
  italy: "it",
  japan: "jp",
  kazakhstan: "kz",
  kenya: "ke",
  "south-korea": "kr",
  mexico: "mx",
  morocco: "ma",
  nigeria: "ng",
  norway: "no",
  paraguay: "py",
  peru: "pe",
  poland: "pl",
  portugal: "pt",
  qatar: "qa",
  romania: "ro",
  russia: "ru",
  "saudi-arabia": "sa",
  scotland: "gb-sct",
  serbia: "rs",
  slovakia: "sk",
  slovenia: "si",
  "south-africa": "za",
  "south-america": "un",
  spain: "es",
  sweden: "se",
  switzerland: "ch",
  thailand: "th",
  tunisia: "tn",
  turkey: "tr",
  "united-arab-emirates": "ae",
  ukraine: "ua",
  uruguay: "uy",
  "united-states": "us",
  venezuela: "ve",
  vietnam: "vn",
  wales: "gb-wls",
  europe: "eu",
  international: "un",
};

/** Regional emoji for non-ISO / UK nation flags. */
const COUNTRY_FLAG_EMOJI: Record<string, string> = {
  england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  europe: "🇪🇺",
  "south-america": "🌎",
  international: "🌐",
};

function humanizeCountryToken(token: string): string {
  return token
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Normalize a country tag like "Algerian Football" to a display label. */
export function countryTagToLabel(countryTag: string): string {
  const base = countryTag.replace(/ Football$/, "").trim();

  if (COUNTRY_LABEL_OVERRIDES[base]) {
    return COUNTRY_LABEL_OVERRIDES[base];
  }

  return humanizeCountryToken(base);
}

/** Stable slug for country filters (from normalized label). */
export function countryTagToSlug(countryTag: string): string {
  return countryTagToLabel(countryTag)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Canonical country key for merging duplicate nationality tags in nav. */
export function countryTagToKey(countryTag: string): string {
  return countryTagToSlug(countryTag);
}

function isoToFlagEmoji(iso2: string): string {
  const code = iso2.toUpperCase();

  if (code.length !== 2) return "";

  const first = code.codePointAt(0);
  const second = code.codePointAt(1);

  if (first == null || second == null) return "";

  return String.fromCodePoint(127397 + first, 127397 + second);
}

/** Flag emoji for a country slug (sidebar / UI). */
export function countrySlugToFlagEmoji(countrySlug: string): string {
  if (COUNTRY_FLAG_EMOJI[countrySlug]) {
    return COUNTRY_FLAG_EMOJI[countrySlug];
  }

  const code = COUNTRY_FLAG_CODE[countrySlug];

  if (!code || code.includes("-") || code === "un") {
    return "🏳️";
  }

  return isoToFlagEmoji(code) || "🏳️";
}

/** flagcdn path code when an image is preferred over emoji. */
export function countrySlugToFlagCdnCode(countrySlug: string): string | null {
  return COUNTRY_FLAG_CODE[countrySlug] ?? null;
}
