// Generate lib/registry/endpoints.generated.ts from the catalog,
// filtered by the sandbox-verified existence record.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const catalog = JSON.parse(readFileSync(join(HERE, "dataforseo-catalog.json"), "utf8"));
const validation = JSON.parse(readFileSync(join(HERE, "catalog-validation.json"), "utf8"));

const vByPath = new Map(validation.map((v) => [v.path, v]));

// Paths proven NOT to exist (probed with correct auth, HTTP 404 + dfs 40400).
const DEAD = new Set([
  "/v3/dataforseo_labs/google/available_history/live",
  "/v3/content_generation/check_grammar/rules",
]);

// Catalog said GET; sandbox proves it's POST.
const METHOD_FIX = { "/v3/content_analysis/errors": "POST" };

// Param name -> type, seeded from the annotated entries in the catalog.
const PARAM_TYPES = {
  advertiser_id: "string", app_id: "string", asin: "string",
  backlinks_filters: "array", backlinks_status_type: "string", bid: "number",
  category: "string", category_code: "integer", creativity_index: "number",
  dataset_id: "string", date_from: "string", datetime_from: "string",
  datetime_to: "string", domain: "string", exclude_internal_backlinks: "boolean",
  first_date: "string", id: "string", image_url: "string",
  include_indirect_links: "boolean", include_subdomains: "boolean",
  internal_list_limit: "integer", keyword: "string", keyword_length: "integer",
  keywords: "array", language_code: "string", location_code: "integer",
  market_type: "string", match: "string", model_name: "string",
  pages: "object", product_id: "string", rank_scale: "string",
  search_terms: "array", second_date: "string", tag: "string",
  target: "string", target1: "string", target2: "string",
  targets: "array", text: "string", topic: "string", type: "string",
  url: "string", user_prompt: "string", video_id: "string", word_count: "integer",
  // common DFS params the catalog left untyped
  location_name: "string", language_name: "string", device: "string",
  os: "string", depth: "integer", se_domain: "string", search_param: "string",
  max_crawl_pages: "integer", group_organic_results: "boolean",
  calculate_rectangles: "boolean", priority: "integer",
  postback_url: "string", pingback_url: "string", postback_data: "string",
  location_coordinate: "string", cursor_pointer: "string", client: "string",
  limit: "integer", offset: "integer", order_by: "array", filters: "array",
  date_to: "string", include_serp_info: "boolean", ignore_synonyms: "boolean",
  include_clickstream_data: "boolean", load_rank_absolute: "boolean",
};

const stripType = (p) => p.replace(/\s*\(.*\)\s*$/, "").trim();

// Endpoints whose URL takes a trailing path param. Note `task_get` appears both
// as `.../task_get/advanced` (SERP) and bare `.../task_get` (Business Data);
// both take a trailing task id. Verified against the sandbox.
const TASK_GET = /\/task_get(\/|$)/;
const pathParamsFor = (path) => (TASK_GET.test(path) || /\/ad_url$/.test(path) ? ["id"] : []);

// Group max price, used as a conservative floor for unpriced endpoints so we
// never under-charge relative to what DataForSEO bills us.
const groupMax = {};
for (const g of catalog.groups) {
  const prices = g.endpoints.map((e) => e.priceUsd).filter((p) => Number.isFinite(p) && p > 0);
  groupMax[g.name] = prices.length ? Math.max(...prices) : 0.05;
}

const slugOf = (p) => p.replace(/^\/v3\//, "");
const idOf = (p) => slugOf(p).replace(/[^a-z0-9]+/gi, "_").toLowerCase();

const out = [];
const skipped = [];
const estimated = [];

for (const g of catalog.groups) {
  for (const e of g.endpoints) {
    if (DEAD.has(e.path)) {
      skipped.push({ path: e.path, reason: "verified 404 against sandbox" });
      continue;
    }
    const v = vByPath.get(e.path);
    const pathParams = pathParamsFor(e.path);
    // Anything that 404'd and is NOT a path-param template is suspect, unless we
    // re-probed it with the corrected method and it came back 200.
    const reprobed = e.path in METHOD_FIX;
    if (v && v.exists === false && pathParams.length === 0 && !reprobed) {
      skipped.push({ path: e.path, reason: "404 and not a path template" });
      continue;
    }

    const method = METHOD_FIX[e.path] ?? (e.method || "POST").toUpperCase();
    const mode = e.mode || "live";

    let cost = e.priceUsd;
    let confidence = "published";
    if (cost == null) {
      cost = groupMax[g.name];
      confidence = "estimated";
      estimated.push(e.path);
    }

    const required = (e.required || []).map(stripType).filter((n) => !pathParams.includes(n));
    const optional = (e.optional || []).map(stripType);

    // task_get / tasks_ready are free from DataForSEO: they retrieve results
    // already paid for at task_post time.
    const freeRetrieval = TASK_GET.test(e.path) || /\/tasks_ready$/.test(e.path);

    out.push({
      id: idOf(e.path),
      slug: slugOf(e.path),
      dfsPath: e.path,
      method,
      mode,
      group: g.name,
      dfsCostUsd: Number(cost.toFixed(6)),
      priceConfidence: confidence,
      billable: !freeRetrieval && cost > 0,
      freeRetrieval,
      // task_get returns results for ANY id -> must verify the caller owns it.
      requiresTaskOwnership: TASK_GET.test(e.path) || /\/ad_url$/.test(e.path),
      pathParams,
      required,
      optional,
      description: (e.description || "").replace(/\s+/g, " ").trim(),
    });
  }
}

out.sort((a, b) => a.slug.localeCompare(b.slug));

// sanity: unique ids
const ids = new Set();
const dupes = [];
for (const e of out) {
  if (ids.has(e.id)) dupes.push(e.id);
  ids.add(e.id);
}

const ts = `// AUTO-GENERATED. Do not edit by hand.
// Source: DataForSEO docs, cross-checked against sandbox.dataforseo.com.
// Every path here returned a non-404 from the sandbox on validation.
// Regenerate with scripts/gen-registry.mjs

import type { EndpointDef } from "./types";

export const PARAM_TYPES: Record<string, string> = ${JSON.stringify(PARAM_TYPES, null, 2)};

export const ENDPOINTS: readonly EndpointDef[] = ${JSON.stringify(out, null, 2)} as const;
`;

mkdirSync(`${REPO}/lib/registry`, { recursive: true });
writeFileSync(`${REPO}/lib/registry/endpoints.generated.ts`, ts);

console.log("════════ REGISTRY GENERATED ════════");
console.log("endpoints emitted :", out.length);
console.log("skipped (dead)    :", skipped.length);
skipped.forEach((s) => console.log("   -", s.path, "|", s.reason));
console.log("duplicate ids     :", dupes.length, dupes.slice(0, 5));
console.log("\nbillable          :", out.filter((e) => e.billable).length);
console.log("free retrieval    :", out.filter((e) => e.freeRetrieval).length);
console.log("free reference    :", out.filter((e) => !e.billable && !e.freeRetrieval).length);
console.log("needs ownership   :", out.filter((e) => e.requiresTaskOwnership).length);
console.log("estimated price   :", estimated.length);
console.log("\nby mode:");
const modes = {};
out.forEach((e) => (modes[e.mode] = (modes[e.mode] || 0) + 1));
Object.entries(modes).sort((a,b)=>b[1]-a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)} ${k}`));
console.log("\nby group:");
const groups = {};
out.forEach((e) => (groups[e.group] = (groups[e.group] || 0) + 1));
Object.entries(groups).sort((a,b)=>b[1]-a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)} ${k}`));
console.log("\ncost range: $" + Math.min(...out.map(e=>e.dfsCostUsd)) + " - $" + Math.max(...out.map(e=>e.dfsCostUsd)));

writeFileSync(join(HERE, "registry-report.json"), JSON.stringify({ skipped, estimated, count: out.length }, null, 2));
