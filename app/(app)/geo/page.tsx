"use client";

import { useState } from "react";
import { SegmentedTabs, type SegmentedTab } from "@/components/backlinks/segmented-tabs";
import { BrandVisibility } from "@/components/geo/brand/brand-visibility";
import { AskAi } from "@/components/geo/ask/ask-ai";

type Mode = "brand" | "ask";

const MODES: SegmentedTab<Mode>[] = [
  { value: "brand", label: "Brand Visibility" },
  { value: "ask", label: "Ask the AI" },
];

export default function GeoPage() {
  const [mode, setMode] = useState<Mode>("brand");

  return (
    <div className="container mx-auto space-y-6 p-4 md:space-y-8 md:p-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">AI Visibility (GEO)</h1>
        <p className="text-muted-foreground">
          See how ChatGPT, Claude, Gemini, and Perplexity mention, rank, and cite your brand.
        </p>
      </div>

      <SegmentedTabs tabs={MODES} value={mode} onChange={setMode} />

      {mode === "brand" ? <BrandVisibility /> : <AskAi />}
    </div>
  );
}
