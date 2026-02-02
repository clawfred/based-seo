/** Client-side wrappers for the folder API routes. */

import type { KeywordData } from "@/lib/types";

export interface ApiFolderWithCount {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  keywordCount: number;
}

export interface ApiFolderDetail {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  keywords: {
    id: string;
    keyword: string;
    volume: number;
    kd: number;
    cpc: number;
    competition: number;
    intent: string;
    trend: number[];
    savedAt: string;
  }[];
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await (window as any).__privyGetAccessToken?.();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...init, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "API error");
  return json.data;
}

export async function fetchFolders(): Promise<ApiFolderWithCount[]> {
  return apiFetch(`/api/folders`);
}

export async function fetchFolderDetail(folderId: string): Promise<ApiFolderDetail> {
  return apiFetch(`/api/folders/${folderId}`);
}

export async function createFolderApi(name: string): Promise<ApiFolderWithCount> {
  return apiFetch("/api/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function renameFolderApi(folderId: string, name: string): Promise<void> {
  const token = await (window as any).__privyGetAccessToken?.();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  await fetch(`/api/folders/${folderId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ name }),
  });
}

export async function deleteFolderApi(folderId: string): Promise<void> {
  const token = await (window as any).__privyGetAccessToken?.();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  await fetch(`/api/folders/${folderId}`, { method: "DELETE", headers });
}

export async function addKeywordsApi(folderId: string, keywords: KeywordData[]): Promise<void> {
  const token = await (window as any).__privyGetAccessToken?.();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  await fetch(`/api/folders/${folderId}/keywords`, {
    method: "POST",
    headers,
    body: JSON.stringify({ keywords }),
  });
}

export async function removeKeywordApi(folderId: string, keyword: string): Promise<void> {
  const token = await (window as any).__privyGetAccessToken?.();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  await fetch(`/api/folders/${folderId}/keywords`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ keyword }),
  });
}
