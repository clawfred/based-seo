/** The three LLM-mentions endpoints the Brand Visibility mode runs. */
export const BRAND_SLUGS = {
  /** Aggregated mention metrics for one target. required: target. */
  targetMetrics: "ai_optimization/llm_mentions/target_metrics/live",
  /** Competitor leaderboard for a topic keyword. required: keyword. */
  topBrands: "ai_optimization/llm_mentions/top_mentioned_brands/live",
  /** Mentions gained vs lost over time. required: target|keyword. */
  timeseries: "ai_optimization/llm_mentions/timeseries_new_lost/live",
} as const;
