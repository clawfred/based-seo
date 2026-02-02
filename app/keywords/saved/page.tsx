"use client";

import { useState, useEffect, useCallback } from "react";
import { FolderPlus, ChevronLeft, Loader2, X, CloudOff, Cloud, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadTextFile, toCsv } from "@/lib/csv";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFolders } from "@/hooks/use-folders";
import { useCurrentUser } from "@/hooks/use-current-user";
import { FolderGrid } from "@/components/keywords/saved/folder-grid";
import { FolderDetail } from "@/components/keywords/saved/folder-detail";
import type { KeywordFolder } from "@/lib/types";

const BANNER_DISMISS_KEY = "saved-keywords-sync-banner-dismissed";

export default function SavedKeywordsPage() {
  const { userId, authenticated } = useCurrentUser();
  const {
    folders,
    loading,
    createFolder,
    deleteFolder,
    renameFolder,
    removeKeyword,
    loadFolderDetail,
  } = useFolders(userId);

  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [expandedFolder, setExpandedFolder] = useState<KeywordFolder | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    // default true to avoid flash; compute on client when available
    if (typeof window === "undefined") return true;
    return localStorage.getItem(BANNER_DISMISS_KEY) === "true";
  });

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    localStorage.setItem(BANNER_DISMISS_KEY, "true");
  }, []);

  const showSyncBanner = !bannerDismissed && !expandedFolder && !authenticated;
  const collapseFolder = useCallback(() => {
    setExpandedFolderId(null);
    setExpandedFolder(null);
    setLoadingDetail(false);
  }, []);

  const expandFolder = useCallback((folderId: string) => {
    setExpandedFolderId(folderId);
    setExpandedFolder(null);
    setLoadingDetail(true);
  }, []);

  // Load folder detail when expanded
  useEffect(() => {
    if (!expandedFolderId) return;

    let cancelled = false;
    loadFolderDetail(expandedFolderId).then((folder) => {
      if (!cancelled) {
        setExpandedFolder(folder);
        setLoadingDetail(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [expandedFolderId, loadFolderDetail]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName);
    setNewFolderName("");
    setIsCreateDialogOpen(false);
  };

  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolder(folderId);
    if (expandedFolderId === folderId) collapseFolder();
  };

  const handleRename = async () => {
    if (!renameFolderId || !renameValue.trim()) return;
    await renameFolder(renameFolderId, renameValue);
    setRenameDialogOpen(false);
    setRenameFolderId(null);
    setRenameValue("");
  };

  const handleStartRename = (folderId: string, currentName: string) => {
    setRenameFolderId(folderId);
    setRenameValue(currentName);
    setRenameDialogOpen(true);
  };

  const handleRemoveKeyword = async (folderId: string, keyword: string) => {
    await removeKeyword(folderId, keyword);
    // Refresh the detail view
    const updated = await loadFolderDetail(folderId);
    setExpandedFolder(updated);
  };

  const handleExportCsv = useCallback(() => {
    if (!expandedFolder) return;

    const rows = expandedFolder.keywords.map((k) => ({
      keyword: k.keyword,
      volume: k.volume,
      kd: k.kd,
      cpc: k.cpc,
      competition: k.competition,
      intent: k.intent,
      trend: Array.isArray(k.trend) ? k.trend.join("|") : "",
    }));

    const csv = toCsv(rows, ["keyword", "volume", "kd", "cpc", "competition", "intent", "trend"]);

    const safeName = expandedFolder.name
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .toLowerCase();

    downloadTextFile({
      filename: `${safeName || "saved-keywords"}.csv`,
      content: csv,
      mimeType: "text/csv;charset=utf-8",
    });
  }, [expandedFolder]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            {expandedFolder ? (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={collapseFolder}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">{expandedFolder.name}</h1>
                  <p className="mt-1 text-muted-foreground">
                    {expandedFolder.keywords.length} keywords saved
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Saved Keywords</h1>
                <p className="mt-2 text-muted-foreground">
                  Organize your keyword research into folders
                </p>
              </div>
            )}
          </div>
          {expandedFolder ? (
            <Button variant="outline" className="gap-2" onClick={handleExportCsv}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          ) : !expandedFolderId ? (
            <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
          ) : null}
        </div>

        {showSyncBanner && (
          <div className="relative flex items-center gap-3 rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
            <CloudOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Folders saved in browser only. Sign in to sync across devices.
            </p>
            <button
              onClick={dismissBanner}
              className="ml-auto shrink-0 rounded-md p-1 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/50 dark:hover:text-amber-200"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {expandedFolderId && loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : expandedFolder ? (
          <FolderDetail folder={expandedFolder} onDeleteKeyword={handleRemoveKeyword} />
        ) : (
          <FolderGrid
            folders={folders}
            authenticated={authenticated}
            onExpand={expandFolder}
            onDelete={handleDeleteFolder}
            onStartRename={handleStartRename}
            onCreateFolder={() => setIsCreateDialogOpen(true)}
          />
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Give your folder a name to organize your keywords</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>Enter a new name for this folder</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Folder name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
