import type { KeywordMetrics, SerpResult, KeywordIdea } from "./types";
import { x402Fetch } from "./x402-client";
import { getAccount, getWalletClient } from "wagmi/actions";
import type { Config } from "wagmi";
import { balanceEvents } from "./balance-events";

let _wagmiConfig: Config | null = null;
export function setWagmiConfig(config: Config) {
  _wagmiConfig = config;
}

let _authTokenGetter: (() => Promise<string | null>) | null = null;
export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  _authTokenGetter = getter;
}
export function getAuthToken(): Promise<string | null> | null {
  return _authTokenGetter?.() ?? null;
}

let _privyWalletAddress: `0x${string}` | null = null;
export function setPrivyWalletAddress(address: `0x${string}`) {
  _privyWalletAddress = address;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  warning?: string;
}

async function apiFetch<T>(
  url: string,
  body: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
): Promise<ApiResponse<T>> {
  const token = await _authTokenGetter?.();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders ?? {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 402) {
    if (!_wagmiConfig) {
      throw new Error("Payment required — wallet not initialized");
    }

    const account = getAccount(_wagmiConfig);

    if (!account.isConnected) {
      throw new Error("Payment required — connect wallet to continue");
    }

    const walletClient = await getWalletClient(_wagmiConfig, {
      account: _privyWalletAddress || account.address,
    });

    const paidRes = await x402Fetch(url, body, walletClient, extraHeaders);

    if (!paidRes.ok) {
      let errorMessage = `API error ${paidRes.status}`;
      try {
        const json = await paidRes.json();
        errorMessage = json.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${paidRes.status}: ${paidRes.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const json = await paidRes.json();
    balanceEvents.emit();
    return json as ApiResponse<T>;
  }

  if (!res.ok) {
    let errorMessage = `API error ${res.status}`;
    try {
      const json = await res.json();
      errorMessage = json.error || errorMessage;
    } catch {
      errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const json = await res.json();
  return json as ApiResponse<T>;
}

export interface CompleteKeywordData {
  overview: KeywordMetrics;
  ideas: KeywordIdeaWithMeta[];
  serp: SerpResult[];
}

export async function fetchKeywordOverview(
  keyword: string,
  locationCode: number = 2840,
  languageCode: string = "en",
): Promise<ApiResponse<CompleteKeywordData>> {
  return apiFetch<CompleteKeywordData>("/api/keywords/overview", {
    keyword,
    location_code: locationCode,
    language_code: languageCode,
  });
}

export interface CompleteKeywordBatchItem {
  overview: KeywordMetrics;
  ideas: KeywordIdeaWithMeta[];
  serp: SerpResult[];
  // When something fails per-keyword we may return an item with error.
  error?: string;
  keyword?: string;
}

export async function fetchKeywordOverviewBatch(
  keywords: string[],
  locationCode: number = 2840,
  languageCode: string = "en",
): Promise<ApiResponse<CompleteKeywordBatchItem[]>> {
  return apiFetch<CompleteKeywordBatchItem[]>(
    "/api/keywords/overview/batch",
    {
      keywords,
      location_code: locationCode,
      language_code: languageCode,
    },
    {
      // Used by x402 dynamic pricing on the server.
      "x-keyword-count": String(keywords.length),
    },
  );
}

export interface KeywordIdeaWithMeta extends KeywordIdea {
  cpc?: number;
  competition?: number;
  intent?: string;
  trend?: number[];
}

export async function fetchKeywordIdeas(
  keyword: string,
  locationCode: number = 2840,
  languageCode: string = "en",
): Promise<ApiResponse<KeywordIdeaWithMeta[]>> {
  return apiFetch<KeywordIdeaWithMeta[]>("/api/keywords/ideas", {
    keyword,
    location_code: locationCode,
    language_code: languageCode,
  });
}

export const fetchCompleteKeywordData = fetchKeywordOverview;
