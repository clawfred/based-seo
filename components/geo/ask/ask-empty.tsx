import { MessageSquareQuote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ENGINES } from "./engines";

/** Idle state for Ask-the-AI: what the mode does, plus the engines it covers. */
export function AskEmpty() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-6 py-14 text-center">
        <div className="max-w-md space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
            <MessageSquareQuote className="h-6 w-6 text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold">See exactly what the AI says</h2>
          <p className="text-sm text-muted-foreground">
            Ask a real customer question and capture the live answer from any major engine - the
            same response your buyers see when they ask AI for a recommendation.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {ENGINES.map((e) => (
            <span
              key={e.id}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${e.accent}`}
            >
              <span className="font-semibold">{e.label}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
