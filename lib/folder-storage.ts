import type { KeywordData, KeywordFolder } from "@/lib/types";

const STORAGE_KEY = "betterseo_folders";

interface StoredFolder {
  id: string;
  name: string;
  keywords: KeywordData[];
  createdAt: string;
}

function parseFolder(stored: StoredFolder): KeywordFolder {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
  };
}

export function getFolders(): KeywordFolder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: StoredFolder[] = JSON.parse(raw);
    return parsed.map(parseFolder);
  } catch {
    return [];
  }
}

function persistFolders(folders: KeywordFolder[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
}

export function saveFolder(folder: KeywordFolder): void {
  const folders = getFolders();
  folders.push(folder);
  persistFolders(folders);
}

export function updateFolder(folderId: string, updates: Partial<Omit<KeywordFolder, "id">>): void {
  const folders = getFolders();
  const idx = folders.findIndex((f) => f.id === folderId);
  if (idx === -1) return;
  folders[idx] = { ...folders[idx], ...updates };
  persistFolders(folders);
}

export function deleteFolder(folderId: string): void {
  const folders = getFolders().filter((f) => f.id !== folderId);
  persistFolders(folders);
}

export function removeKeywordFromFolder(folderId: string, keywordName: string): void {
  const folders = getFolders();
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return;
  folder.keywords = folder.keywords.filter((k) => k.keyword !== keywordName);
  persistFolders(folders);
}

export function addKeywordsToFolder(folderId: string, keywords: KeywordData[]): void {
  const folders = getFolders();
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return;
  for (const keyword of keywords) {
    if (!folder.keywords.some((k) => k.keyword === keyword.keyword)) {
      folder.keywords.push(keyword);
    }
  }
  persistFolders(folders);
}
