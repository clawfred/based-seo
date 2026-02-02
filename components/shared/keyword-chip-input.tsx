"use client";

import { memo, useRef } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KeywordChipInputProps {
  chips: string[];
  onChipsChange: (chips: string[]) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const KeywordChipInput = memo(function KeywordChipInput({
  chips,
  onChipsChange,
  inputValue,
  onInputChange,
  onSubmit,
  disabled = false,
  placeholder = "Enter keywords…",
}: KeywordChipInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function addChip(raw: string) {
    const value = raw.trim().toLowerCase();
    if (value && !chips.includes(value)) {
      onChipsChange([...chips, value]);
    }
    onInputChange("");
  }

  function removeChip(index: number) {
    onChipsChange(chips.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addChip(inputValue);
      } else if (chips.length > 0) {
        onSubmit();
      }
    } else if (e.key === "Backspace" && inputValue === "" && chips.length > 0) {
      removeChip(chips.length - 1);
    }
  }

  function addMany(raw: string) {
    const parts = raw.split(/[,\n\r]+/);
    const newChips = [...chips];
    for (const part of parts) {
      const value = part.trim().toLowerCase();
      if (value && !newChips.includes(value)) {
        newChips.push(value);
      }
    }
    if (newChips.length !== chips.length) {
      onChipsChange(newChips);
    }
    onInputChange("");
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (text.includes(",") || text.includes("\n")) {
      e.preventDefault();
      addMany(inputValue + text);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.includes(",") || val.includes("\n")) {
      addMany(val);
    } else {
      onInputChange(val);
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs transition-colors",
        "focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:border-ring",
        disabled && "cursor-not-allowed opacity-50",
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {chips.map((chip, i) => (
        <Badge
          key={chip}
          variant="outline"
          className="gap-1 shrink-0 bg-primary/10 text-foreground border-primary/20 dark:bg-primary/20 dark:border-primary/30"
        >
          {chip}
          <button
            type="button"
            className="ml-0.5 rounded-full p-0.5 opacity-60 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              removeChip(i);
            }}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={chips.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
});
