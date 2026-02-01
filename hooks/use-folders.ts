"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getFolders,
  saveFolder as persistNewFolder,
  deleteFolder as deleteFolderStorage,
  updateFolder as updateFolderStorage,
  addKeywordsToFolder as addKeywordsStorage,
  removeKeywordFromFolder as removeKeywordStorage,
} from "@/lib/folder-storage";
import {
  fetchFolders,
  fetchFolderDetail,
  createFolderApi,
  renameFolderApi,
  deleteFolderApi,
  addKeywordsApi,
  removeKeywordApi,
} from "@/lib/folders-api";
import type { KeywordFolder, KeywordData } from "@/lib/types";

const FOLDERS_UPDATED_EVENT = "folders-updated";

function dispatchFoldersUpdated() {
  window.dispatchEvent(new CustomEvent(FOLDERS_UPDATED_EVENT));
}

/**
 * Unified folder hook.
 * - When userId is provided → uses DB via API routes.
 * - When userId is null/undefined → uses localStorage (guest mode).
 */
export function useFolders(userId?: string | null) {
  const isDb = !!userId;
  const [folders, setFolders] = useState<KeywordFolder[]>(() => (isDb ? [] : getFolders()));
  const [loading, setLoading] = useState(isDb);

  // --- DB mode: fetch folders from API ---
  const refreshDb = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const apiFolders = await fetchFolders(userId);
      // Convert to KeywordFolder shape (keywords empty at list level)
      setFolders(
        apiFolders.map((f) => ({
          id: f.id,
          name: f.name,
          keywords: [], // populated on expand via fetchFolderDetail
          createdAt: new Date(f.createdAt),
          _keywordCount: f.keywordCount,
        })),
      );
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // --- localStorage mode: sync via events ---
  const refreshLocal = useCallback(() => {
    setFolders(getFolders());
  }, []);

  useEffect(() => {
    if (isDb) {
      refreshDb();
    } else {
      const handleUpdate = () => refreshLocal();
      window.addEventListener(FOLDERS_UPDATED_EVENT, handleUpdate);
      window.addEventListener("storage", handleUpdate);
      return () => {
        window.removeEventListener(FOLDERS_UPDATED_EVENT, handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      };
    }
  }, [isDb, refreshDb, refreshLocal]);

  // --- Folder detail (DB mode loads keywords lazily) ---
  const loadFolderDetail = useCallback(
    async (folderId: string): Promise<KeywordFolder | null> => {
      if (!isDb) {
        return folders.find((f) => f.id === folderId) ?? null;
      }
      try {
        const detail = await fetchFolderDetail(folderId);
        return {
          id: detail.id,
          name: detail.name,
          createdAt: new Date(detail.createdAt),
          keywords: detail.keywords.map((kw) => ({
            keyword: kw.keyword,
            volume: kw.volume,
            kd: kw.kd,
            cpc: kw.cpc,
            competition: kw.competition,
            intent: kw.intent as KeywordData["intent"],
            trend: kw.trend ?? [],
          })),
        };
      } catch (err) {
        console.error("Failed to load folder detail:", err);
        return null;
      }
    },
    [isDb, folders],
  );

  // --- CRUD ---
  const createFolder = useCallback(
    async (name: string) => {
      if (isDb && userId) {
        const created = await createFolderApi(userId, name);
        await refreshDb();
        return {
          id: created.id,
          name: created.name,
          keywords: [],
          createdAt: new Date(created.createdAt),
        };
      }
      const newFolder: KeywordFolder = {
        id: Date.now().toString(),
        name: name.trim(),
        keywords: [],
        createdAt: new Date(),
      };
      persistNewFolder(newFolder);
      dispatchFoldersUpdated();
      return newFolder;
    },
    [isDb, userId, refreshDb],
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      if (isDb) {
        await deleteFolderApi(folderId);
        await refreshDb();
      } else {
        deleteFolderStorage(folderId);
        dispatchFoldersUpdated();
      }
    },
    [isDb, refreshDb],
  );

  const renameFolder = useCallback(
    async (folderId: string, name: string) => {
      if (isDb) {
        await renameFolderApi(folderId, name);
        await refreshDb();
      } else {
        updateFolderStorage(folderId, { name: name.trim() });
        dispatchFoldersUpdated();
      }
    },
    [isDb, refreshDb],
  );

  const addKeywords = useCallback(
    async (folderId: string, keywords: KeywordData[]) => {
      if (isDb) {
        await addKeywordsApi(folderId, keywords);
      } else {
        addKeywordsStorage(folderId, keywords);
        dispatchFoldersUpdated();
      }
    },
    [isDb],
  );

  const removeKeyword = useCallback(
    async (folderId: string, keywordName: string) => {
      if (isDb) {
        await removeKeywordApi(folderId, keywordName);
      } else {
        removeKeywordStorage(folderId, keywordName);
        dispatchFoldersUpdated();
      }
    },
    [isDb],
  );

  return {
    folders,
    loading,
    createFolder,
    deleteFolder,
    renameFolder,
    addKeywords,
    removeKeyword,
    loadFolderDetail,
  };
}
