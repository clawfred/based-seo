"use client";

import {
  Trash2,
  MoreVertical,
  ChevronLeft,
  Pencil,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KeywordFolder } from "@/lib/types";

interface FolderGridProps {
  folders: KeywordFolder[];
  authenticated: boolean;
  onExpand: (folderId: string) => void;
  onDelete: (folderId: string) => void;
  onStartRename: (folderId: string, currentName: string) => void;
  onCreateFolder: () => void;
}

export function FolderGrid({
  folders,
  authenticated,
  onExpand,
  onDelete,
  onStartRename,
  onCreateFolder,
}: FolderGridProps) {
  if (folders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-[450px] flex-col items-center justify-center p-12 text-center">
          <div className="rounded-2xl bg-muted/50 p-6">
            <FolderPlus className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <h3 className="mt-6 text-xl font-semibold">No folders yet</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Create your first folder to start organizing keyword research. Save keywords from
            Keyword Finder or Keyword Overview into folders for easy access.
          </p>
          <Button className="mt-8 gap-2" size="lg" onClick={onCreateFolder}>
            <FolderPlus className="h-4 w-4" />
            Create First Folder
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <Card
            key={folder.id}
            className="group cursor-pointer transition-all hover:shadow-md hover:border-foreground/20"
            onClick={() => onExpand(folder.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-950">
                    <FolderOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{folder.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Created {folder.createdAt.toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartRename(folder.id, folder.name);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(folder.id);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {folder._keywordCount ?? folder.keywords.length} keyword
                    {(folder._keywordCount ?? folder.keywords.length) !== 1 ? "s" : ""}
                  </span>
                  {authenticated ? (
                    <Tooltip>
                      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Badge
                          variant="secondary"
                          className="gap-1 px-1.5 py-0 text-[10px] font-normal text-emerald-700 dark:text-emerald-400"
                        >
                          <Cloud className="h-2.5 w-2.5" />
                          Synced
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Synced to your account</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Badge
                          variant="outline"
                          className="gap-1 px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                        >
                          <HardDrive className="h-2.5 w-2.5" />
                          Local only
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Saved in this browser only — sign in to sync</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
