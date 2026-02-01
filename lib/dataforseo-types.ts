// DataForSEO API Response Types

export interface DataForSEOResponse<T> {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: DataForSEOTask<T>[];
}

export interface DataForSEOTask<T> {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  path: string[];
  data: Record<string, unknown>;
  result: T[];
}

// Keyword Overview
export interface KeywordOverviewResult {
  keyword: string;
  location_code: number;
  language_code: string;
  search_partners: boolean;
  keyword_info: {
    se_type: string;
    last_updated_time: string;
    competition: number;
    competition_level: string;
    cpc: number;
    search_volume: number;
    low_top_of_page_bid: number;
    high_top_of_page_bid: number;
    categories: number[];
    monthly_searches: MonthlySearch[];
  };
  keyword_properties: {
    se_type: string;
    core_keyword: string | null;
    synonym_clustering_algorithm: string;
    keyword_difficulty: number;
    detected_language: string;
    is_another_language: boolean;
  };
  impressions_info: {
    se_type: string;
    last_updated_time: string;
    bid: number;
    match_type: string;
    ad_position_min: number | null;
    ad_position_max: number | null;
    ad_position_average: number | null;
    cpc_min: number | null;
    cpc_max: number | null;
    cpc_average: number | null;
    daily_impressions_min: number | null;
    daily_impressions_max: number | null;
    daily_impressions_average: number | null;
    daily_clicks_min: number | null;
    daily_clicks_max: number | null;
    daily_clicks_average: number | null;
    daily_cost_min: number | null;
    daily_cost_max: number | null;
    daily_cost_average: number | null;
  };
  serp_info: {
    se_type: string;
    check_url: string;
    serp_item_types: string[];
    se_results_count: number;
    last_updated_time: string;
    previous_updated_time: string;
  };
  search_intent_info: {
    se_type: string;
    main_intent: string;
    foreign_intent: string[];
    last_updated_time: string;
  };
  keyword_info_normalized_with_bing?: unknown;
  keyword_info_normalized_with_clickstream?: unknown;
  avg_backlinks_info?: {
    se_type: string;
    backlinks: number;
    dofollow: number;
    referring_pages: number;
    referring_domains: number;
    referring_main_domains: number;
    rank: number;
    main_domain_rank: number;
    last_updated_time: string;
  };
}

export interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

// Related Keywords
export interface RelatedKeywordsResult {
  se_type: string;
  seed_keyword: string;
  seed_keyword_data: SeedKeywordData | null;
  items: RelatedKeywordItem[] | null;
  total_count: number;
}

export interface SeedKeywordData {
  se_type: string;
  keyword: string;
  location_code: number;
  language_code: string;
  keyword_info: {
    se_type: string;
    last_updated_time: string;
    competition: number;
    competition_level: string;
    cpc: number;
    search_volume: number;
    low_top_of_page_bid: number;
    high_top_of_page_bid: number;
    categories: number[];
    monthly_searches: MonthlySearch[];
  };
  keyword_properties: {
    se_type: string;
    core_keyword: string | null;
    synonym_clustering_algorithm: string;
    keyword_difficulty: number;
    detected_language: string;
    is_another_language: boolean;
  };
  search_intent_info: {
    se_type: string;
    main_intent: string;
    foreign_intent: string[];
    last_updated_time: string;
  };
}

export interface RelatedKeywordItem {
  se_type: string;
  keyword_data: {
    se_type: string;
    keyword: string;
    location_code: number;
    language_code: string;
    keyword_info: {
      se_type: string;
      last_updated_time: string;
      competition: number;
      competition_level: string;
      cpc: number;
      search_volume: number;
      low_top_of_page_bid: number;
      high_top_of_page_bid: number;
      categories: number[];
      monthly_searches: MonthlySearch[];
    };
    keyword_properties: {
      se_type: string;
      core_keyword: string | null;
      synonym_clustering_algorithm: string;
      keyword_difficulty: number;
      detected_language: string;
      is_another_language: boolean;
    };
    search_intent_info: {
      se_type: string;
      main_intent: string;
      foreign_intent: string[];
      last_updated_time: string;
    };
  };
  depth: number;
  related_keywords: string[] | null;
}

// Keyword Suggestions
export interface KeywordSuggestionsResult {
  se_type: string;
  seed_keyword: string;
  seed_keyword_data: SeedKeywordData | null;
  items: KeywordSuggestionItem[] | null;
  total_count: number;
}

export interface KeywordSuggestionItem {
  se_type: string;
  keyword: string;
  location_code: number;
  language_code: string;
  keyword_info: {
    se_type: string;
    last_updated_time: string;
    competition: number;
    competition_level: string;
    cpc: number;
    search_volume: number;
    low_top_of_page_bid: number;
    high_top_of_page_bid: number;
    categories: number[];
    monthly_searches: MonthlySearch[];
  };
  keyword_properties: {
    se_type: string;
    core_keyword: string | null;
    synonym_clustering_algorithm: string;
    keyword_difficulty: number;
    detected_language: string;
    is_another_language: boolean;
  };
  search_intent_info: {
    se_type: string;
    main_intent: string;
    foreign_intent: string[];
    last_updated_time: string;
  };
}

// SERP
export interface SerpOrganicResult {
  keyword: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  spell: unknown;
  refinement_chips: unknown;
  item_types: string[];
  se_results_count: number;
  items_count: number;
  items: SerpItem[];
}

export interface SerpItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  position: string;
  xpath: string;
  domain: string;
  title: string;
  url: string;
  cache_url: string | null;
  breadcrumb: string;
  website_name: string;
  is_image: boolean;
  is_video: boolean;
  is_featured_snippet: boolean;
  is_malicious: boolean;
  is_web_story: boolean;
  description: string;
  pre_snippet: string | null;
  extended_snippet: string | null;
  amp_version: boolean;
  rating: unknown | null;
  highlighted: string[];
  links: unknown[] | null;
  about_this_result: unknown | null;
  main_domain: string;
  relative_url: string;
  etv: number;
  impressions_etv: number;
  estimated_paid_traffic_cost: number;
  rank_changes: unknown | null;
  backlinks_info: unknown | null;
  rank_info: unknown | null;
}
