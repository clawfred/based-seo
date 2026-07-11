import { CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCount, prettyUrl } from "../geo-format";
import { engineById, type EngineId } from "./engines";
import { extractLlmAnswer } from "./llm-response-extract";

interface AskResponseProps {
  engineId: EngineId;
  data: unknown;
  /** Charge metadata surfaced by the runner. */
  amount: string | null;
  source: string | null;
}

export function AskResponse({ engineId, data, amount, source }: AskResponseProps) {
  const engine = engineById(engineId);
  const answer = extractLlmAnswer(data);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${engine.accent}`}>
          <span className="text-sm font-semibold">{engine.label[0]}</span>
        </span>
        <span className="font-medium">{engine.label}</span>
        {answer?.model && (
          <Badge variant="outline" className="text-[10px]">
            {answer.model}
          </Badge>
        )}
        {source && (
          <Badge variant="outline" className="gap-1 text-[10px]">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {source === "free" ? "free" : `paid via ${source}`}
            {amount && amount !== "$0" ? ` · ${amount}` : ""}
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {answer && answer.text ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{answer.text}</p>
          ) : (
            <details open>
              <summary className="cursor-pointer text-sm text-muted-foreground">
                No plain-text answer was parsed — show raw response
              </summary>
              <pre className="mt-3 max-h-[28rem] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
                {JSON.stringify(answer?.raw ?? data, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>

      {answer && answer.citations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sources cited ({answer.citations.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {answer.citations.map((c, i) => (
              <a
                key={`${c.url}-${i}`}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.title || prettyUrl(c.url)}</span>
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {answer && (answer.inputTokens !== undefined || answer.outputTokens !== undefined) && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {answer.inputTokens !== undefined && (
            <Badge variant="secondary">In: {formatCount(answer.inputTokens)} tok</Badge>
          )}
          {answer.outputTokens !== undefined && (
            <Badge variant="secondary">Out: {formatCount(answer.outputTokens)} tok</Badge>
          )}
        </div>
      )}
    </div>
  );
}
