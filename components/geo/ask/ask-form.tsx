"use client";

import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENGINES, type EngineId } from "./engines";

interface AskFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  engineId: EngineId;
  onEngineChange: (id: EngineId) => void;
  models: string[];
  model: string;
  onModelChange: (model: string) => void;
  onSubmit: () => void;
  loading: boolean;
  /** e.g. `from $0.01` — base price; token cost is added at settlement. */
  priceLabel: string | null;
}

const SAMPLE_PROMPTS = [
  "What are the best project management tools?",
  "Recommend an alternative to Notion.",
  "Which analytics platforms do developers trust?",
];

export function AskForm({
  prompt,
  onPromptChange,
  engineId,
  onEngineChange,
  models,
  model,
  onModelChange,
  onSubmit,
  loading,
  priceLabel,
}: AskFormProps) {
  const disabled = loading || prompt.trim().length === 0;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !disabled) onSubmit();
          }}
          disabled={loading}
          placeholder="Ask an AI engine a question your customers would ask…"
          rows={3}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Try:</span>
          {SAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => !loading && onPromptChange(p)}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={engineId} onValueChange={(v) => onEngineChange(v as EngineId)}>
            <SelectTrigger className="h-11 w-full sm:w-44">
              <SelectValue placeholder="Engine" />
            </SelectTrigger>
            <SelectContent>
              {ENGINES.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger className="h-11 w-full sm:w-56">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-1 items-center justify-end gap-3">
            {priceLabel && <span className="text-xs text-muted-foreground">{priceLabel}</span>}
            <Button onClick={onSubmit} disabled={disabled} className="h-11 gap-2 px-6">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Ask
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
