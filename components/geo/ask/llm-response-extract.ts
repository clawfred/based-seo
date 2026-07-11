/**
 * Pulls the human-readable answer (and its citations/metadata) out of a
 * DataForSEO `.../llm_responses/live` envelope.
 *
 * The structured response nests the actual text inside `result[0].items[]`,
 * where each message carries `sections[]` of text, and citations live in each
 * section's `annotations[]`. Field names vary a little between engines, so we
 * walk the tree collecting anything that looks like text or a link rather than
 * hard-coding one path.
 */

import { resultOf, num, str, type Row } from "../geo-extract";

export interface Citation {
  title?: string;
  url: string;
}

export interface LlmAnswer {
  /** Joined answer text. Empty string when nothing textual was found. */
  text: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  moneySpent?: number;
  citations: Citation[];
  /** The raw result object, for the "show raw" fallback. */
  raw: unknown;
}

export function extractLlmAnswer(data: unknown): LlmAnswer | null {
  const result = resultOf(data);
  if (!result) return null;

  const texts: string[] = [];
  const citations: Citation[] = [];

  const items = Array.isArray((result as { items?: unknown[] }).items)
    ? ((result as { items: unknown[] }).items as unknown[])
    : [];
  for (const item of items) collect(item, texts, citations, 0);

  // Some engines return the answer directly on the result rather than in items.
  if (texts.length === 0) {
    const direct = str(result, ["message", "content", "response", "text", "output", "message_content"]);
    if (direct) texts.push(direct);
  }

  return {
    text: texts.join("\n\n").trim(),
    model: str(result, ["model_name", "model"]),
    inputTokens: num(result, ["input_tokens", "prompt_tokens"]),
    outputTokens: num(result, ["output_tokens", "completion_tokens"]),
    moneySpent: num(result, ["money_spent", "cost"]),
    citations: dedupe(citations),
    raw: result,
  };
}

/** Recursively gather text and citation links from a message/section node. */
function collect(node: unknown, texts: string[], citations: Citation[], depth: number): void {
  if (depth > 6 || node === null || typeof node !== "object") return;
  const row = node as Row;

  const text = str(row, ["text", "content", "message", "markdown"]);
  if (text) texts.push(text);

  const annotations = row.annotations;
  if (Array.isArray(annotations)) {
    for (const ann of annotations) {
      if (ann && typeof ann === "object") {
        const url = str(ann as Row, ["url", "link", "href"]);
        if (url) citations.push({ url, title: str(ann as Row, ["title", "text", "name"]) });
      }
    }
  }

  const sections = row.sections;
  if (Array.isArray(sections)) {
    for (const section of sections) collect(section, texts, citations, depth + 1);
  }
}

function dedupe(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of citations) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    out.push(c);
  }
  return out;
}
