"use client";

import { useState } from "react";
import { FolderPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFolders } from "@/hooks/use-folders";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { KeywordData } from "@/lib/types";

interface SaveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSave: () => KeywordData[];
  onClearSelection: () => void;
}

export function SaveToFolderDialog({
  open,
  onOpenChange,
  selectedCount,
  onSave,
  onClearSelection,
}: SaveToFolderDialogProps) {
  const { userId } = useCurrentUser();
  const { folders, createFolder, addKeywords } = useFolders(userId);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateInline, setShowCreateInline] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function handleOpenChange(next: boolean) {
    if (next) {
      setSelectedFolderId(folders.length > 0 ? folders[0].id : "");
      setShowCreateInline(folders.length === 0);
      setNewFolderName("");
      setSaveSuccess(false);
    }
    onOpenChange(next);
  }

  async function handleCreateInlineFolder() {
    if (!newFolderName.trim()) return;
    const newFolder = await createFolder(newFolderName);
    setSelectedFolderId(newFolder.id);
    setNewFolderName("");
    setShowCreateInline(false);
  }

  async function handleSaveToFolder() {
    if (!selectedFolderId) return;
    const keywordsToSave = onSave();
    await addKeywords(selectedFolderId, keywordsToSave);
    setSaveSuccess(true);
    setTimeout(() => {
      onOpenChange(false);
      onClearSelection();
      setSaveSuccess(false);
    }, 1200);
  }

  const plural = selectedCount !== 1 ? "s" : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{saveSuccess ? "Saved!" : "Save to Folder"}</DialogTitle>
          <DialogDescription>
            {saveSuccess
              ? `${selectedCount} keyword${plural} saved successfully`
              : `Save ${selectedCount} selected keyword${plural} to a folder`}
          </DialogDescription>
        </DialogHeader>

        {saveSuccess ? (
          <div className="flex flex-col items-center py-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-950">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        ) : (
          <>
            {folders.length > 0 && !showCreateInline ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Choose folder</label>
                  <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} ({f._keywordCount ?? f.keywords.length} keywords)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={() => setShowCreateInline(true)}
                >
                  <FolderPlus className="h-4 w-4" />
                  Create new folder
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {folders.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Create a folder first to save keywords
                  </p>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Folder name</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Blog Keywords"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateInlineFolder()}
                      autoFocus
                    />
                    <Button onClick={handleCreateInlineFolder} disabled={!newFolderName.trim()}>
                      Create
                    </Button>
                  </div>
                </div>
                {folders.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setShowCreateInline(false)}
                  >
                    Back to folder list
                  </Button>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveToFolder} disabled={!selectedFolderId || showCreateInline}>
                Save {selectedCount} Keyword{plural}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
