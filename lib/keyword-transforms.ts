import type { KeywordIdeaWithMeta } from "@/lib/api";
import type { KeywordData } from "@/lib/types";

export function ideaToKeywordData(idea: KeywordIdeaWithMeta): KeywordData {
  return {
    keyword: idea.keyword,
    volume: idea.volume,
    kd: idea.kd,
    cpc: idea.cpc ?? 0,
    competition: idea.competition ?? 0,
    intent: (idea.intent as KeywordData["intent"]) || "Informational",
    trend: idea.trend || [],
  };
}
