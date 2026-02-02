"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getKDColor } from "@/lib/keyword-utils";
import { SaveToFolderDialog } from "@/components/keywords/finder/save-to-folder-dialog";
import type { KeywordIdeaWithMeta } from "@/lib/api";
import type { KeywordData } from "@/lib/types";

interface KeywordIdeasSectionProps {
  ideas: KeywordIdeaWithMeta[];
}

function KeywordIdeasTable({
  ideas,
  selectedKeywords,
  onToggleKeyword,
  onToggleAll,
}: {
  ideas: KeywordIdeaWithMeta[];
  selectedKeywords: Set<string>;
  onToggleKeyword: (keyword: string) => void;
  onToggleAll: () => void;
}) {
  const displayIdeas = ideas.slice(0, 10);
  const allSelected = displayIdeas.every((idea) => selectedKeywords.has(idea.keyword));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
          </TableHead>
          <TableHead>Keyword</TableHead>
          <TableHead className="text-right">Volume</TableHead>
          <TableHead className="text-right">KD</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayIdeas.map((idea) => (
          <TableRow key={idea.keyword}>
            <TableCell>
              <Checkbox
                checked={selectedKeywords.has(idea.keyword)}
                onCheckedChange={() => onToggleKeyword(idea.keyword)}
              />
            </TableCell>
            <TableCell className="font-medium">{idea.keyword}</TableCell>
            <TableCell className="text-right">{idea.volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <span className={getKDColor(idea.kd)}>{idea.kd}%</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function KeywordIdeasSection({ ideas }: KeywordIdeasSectionProps) {
  const [selectedVariations, setSelectedVariations] = useState<Set<string>>(new Set());
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savingType, setSavingType] = useState<"variations" | "questions">("variations");

  if (!ideas || ideas.length === 0) return null;

  const variations = ideas.filter((idea) => idea.type !== "question");
  const questions = ideas.filter((idea) => idea.type === "question");

  const toggleVariation = (keyword: string) => {
    setSelectedVariations((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  };

  const toggleAllVariations = () => {
    const displayVariations = variations.slice(0, 10);
    const allSelected = displayVariations.every((v) => selectedVariations.has(v.keyword));
    if (allSelected) {
      setSelectedVariations(new Set());
    } else {
      setSelectedVariations(new Set(displayVariations.map((v) => v.keyword)));
    }
  };

  const toggleQuestion = (keyword: string) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  };

  const toggleAllQuestions = () => {
    const displayQuestions = questions.slice(0, 10);
    const allSelected = displayQuestions.every((q) => selectedQuestions.has(q.keyword));
    if (allSelected) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(displayQuestions.map((q) => q.keyword)));
    }
  };

  const openSaveDialog = (type: "variations" | "questions") => {
    setSavingType(type);
    setSaveDialogOpen(true);
  };

  const getSelectedKeywordsToSave = (): KeywordData[] => {
    const selected = savingType === "variations" ? selectedVariations : selectedQuestions;
    const sourceIdeas = savingType === "variations" ? variations : questions;

    return sourceIdeas
      .filter((idea) => selected.has(idea.keyword))
      .map((idea) => ({
        keyword: idea.keyword,
        volume: idea.volume,
        kd: idea.kd,
        cpc: idea.cpc ?? 0,
        competition: idea.competition ?? 0,
        intent: (idea.intent ?? "Informational") as
          | "Informational"
          | "Navigational"
          | "Commercial"
          | "Transactional",
        trend: idea.trend ?? [],
      }));
  };

  const clearSelection = () => {
    if (savingType === "variations") {
      setSelectedVariations(new Set());
    } else {
      setSelectedQuestions(new Set());
    }
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Keyword Variations</CardTitle>
                <CardDescription>Related keyword ideas</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={selectedVariations.size === 0}
                onClick={() => openSaveDialog("variations")}
              >
                <FolderPlus className="h-4 w-4" />
                Save ({selectedVariations.size})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <KeywordIdeasTable
              ideas={variations}
              selectedKeywords={selectedVariations}
              onToggleKeyword={toggleVariation}
              onToggleAll={toggleAllVariations}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription>Question-based keywords</CardDescription>
              </div>
              {questions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={selectedQuestions.size === 0}
                  onClick={() => openSaveDialog("questions")}
                >
                  <FolderPlus className="h-4 w-4" />
                  Save ({selectedQuestions.size})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {questions.length > 0 ? (
              <KeywordIdeasTable
                ideas={questions}
                selectedKeywords={selectedQuestions}
                onToggleKeyword={toggleQuestion}
                onToggleAll={toggleAllQuestions}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No question-based keywords found</p>
            )}
          </CardContent>
        </Card>
      </div>

      <SaveToFolderDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        selectedCount={
          savingType === "variations" ? selectedVariations.size : selectedQuestions.size
        }
        onSave={getSelectedKeywordsToSave}
        onClearSelection={clearSelection}
      />
    </>
  );
}
