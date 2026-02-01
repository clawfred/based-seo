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

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "SEARCH_START":
      return { ...state, loading: true, error: null, warning: null, hasSearched: true };
    case "SEARCH_SUCCESS":
      return {
        ...state,
        loading: false,
        results: action.results,
        warning: action.warning ?? null,
      };
    case "SEARCH_ERROR":
      return { ...state, loading: false, error: action.error, results: [] };
  }
}

export const INITIAL_SEARCH: SearchState = {
  loading: false,
  error: null,
  warning: null,
  results: [],
  hasSearched: false,
};
