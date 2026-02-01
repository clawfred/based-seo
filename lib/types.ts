export interface KeywordData {
  keyword: string;
  volume: number;
  kd: number; // Keyword Difficulty (0-100)
  cpc: number;
  competition: number; // 0-1
  intent: "Informational" | "Navigational" | "Commercial" | "Transactional";
  trend: number[]; // 12 months of data
}

export interface KeywordMetrics {
  keyword: string;
  volume: number;
  kd: number;
  cpc: number;
  competition: number;
  intent: "Informational" | "Navigational" | "Commercial" | "Transactional";
  trend: number[];
  globalVolume: {
    country: string;
    volume: number;
  }[];
}

export interface SerpResult {
  position: number;
  url: string;
  domain: string;
  title: string;
}

export interface KeywordIdea {
  keyword: string;
  volume: number;
  kd: number;
  type: "variation" | "question" | "related";
}

export interface KeywordFolder {
  id: string;
  name: string;
  keywords: KeywordData[];
  createdAt: Date;
  /** Server-side keyword count (avoids loading all keywords for list view). */
  _keywordCount?: number;
}

export interface Location {
  code: string;
  name: string;
}
