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
