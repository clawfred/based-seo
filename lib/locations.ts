export interface LocationOption {
  code: string;
  name: string;
  locationCode: number;
  languageCode: string;
}

export const locations: LocationOption[] = [
  { code: "US", name: "United States", locationCode: 2840, languageCode: "en" },
  { code: "UK", name: "United Kingdom", locationCode: 2826, languageCode: "en" },
  { code: "CA", name: "Canada", locationCode: 2124, languageCode: "en" },
  { code: "DE", name: "Germany", locationCode: 2276, languageCode: "de" },
  { code: "FR", name: "France", locationCode: 2250, languageCode: "fr" },
  { code: "AU", name: "Australia", locationCode: 2036, languageCode: "en" },
  { code: "JP", name: "Japan", locationCode: 2392, languageCode: "ja" },
  { code: "BR", name: "Brazil", locationCode: 2076, languageCode: "pt" },
];

export function getLocationByCode(code: string): LocationOption {
  return locations.find((l) => l.code === code) || locations[0];
}
