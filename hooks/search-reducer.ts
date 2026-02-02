import type { KeywordIdeaWithMeta } from "@/lib/api";

export interface SearchState {
  loading: boolean;
  error: string | null;
  warning: string | null;
  results: KeywordIdeaWithMeta[];
  hasSearched: boolean;
}

export type SearchAction =
  | { type: "SEARCH_START" }
  | { type: "SEARCH_SUCCESS"; results: KeywordIdeaWithMeta[]; warning?: string }
  | { type: "SEARCH_ERROR"; error: string };
