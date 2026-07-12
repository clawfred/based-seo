/**
 * The four AI engines DataForSEO can capture a live response from. Each maps to
 * its own registry slug; the model dropdown is populated live from the sibling
 * `/models` reference endpoint, falling back to these curated defaults.
 */

export type EngineId = "chatgpt" | "claude" | "gemini" | "perplexity";

export interface Engine {
  id: EngineId;
  label: string;
  /** Billable live-response slug. */
  slug: string;
  /** Free GET reference slug listing valid `model_name` values. */
  modelsSlug: string;
  /** Fallback models if the reference endpoint can't be reached. First is the default. */
  defaultModels: string[];
  /** Tailwind accent used for the engine's avatar chip. */
  accent: string;
}

export const ENGINES: Engine[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    slug: "ai_optimization/chat_gpt/llm_responses/live",
    modelsSlug: "ai_optimization/chat_gpt/llm_responses/models",
    defaultModels: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
    accent: "text-emerald-500 bg-emerald-500/10",
  },
  {
    id: "claude",
    label: "Claude",
    slug: "ai_optimization/claude/llm_responses/live",
    modelsSlug: "ai_optimization/claude/llm_responses/models",
    defaultModels: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-7-sonnet"],
    accent: "text-orange-500 bg-orange-500/10",
  },
  {
    id: "gemini",
    label: "Gemini",
    slug: "ai_optimization/gemini/llm_responses/live",
    modelsSlug: "ai_optimization/gemini/llm_responses/models",
    defaultModels: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
    accent: "text-blue-500 bg-blue-500/10",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    slug: "ai_optimization/perplexity/llm_responses/live",
    modelsSlug: "ai_optimization/perplexity/llm_responses/models",
    defaultModels: ["sonar", "sonar-pro"],
    accent: "text-violet-500 bg-violet-500/10",
  },
];

export function engineById(id: EngineId): Engine {
  return ENGINES.find((e) => e.id === id) ?? ENGINES[0];
}
