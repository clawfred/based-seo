/**
 * Registry lookups. Read-only view over the generated endpoint table.
 */

import { ENDPOINTS } from "./endpoints.generated";
import type { EndpointDef } from "./types";

export type { EndpointDef, EndpointMode, Exposure, PriceConfidence } from "./types";
export { ENDPOINTS, PARAM_TYPES } from "./endpoints.generated";

/** Endpoints an external caller may reach. Excludes the task-retrieval family. */
export function listPublic(): EndpointDef[] {
  return ENDPOINTS.filter((e) => e.exposure === "public");
}

const BY_SLUG: ReadonlyMap<string, EndpointDef> = new Map(ENDPOINTS.map((e) => [e.slug, e]));
const BY_ID: ReadonlyMap<string, EndpointDef> = new Map(ENDPOINTS.map((e) => [e.id, e]));

/** Exact slug match, e.g. `backlinks/summary/live`. */
export function getBySlug(slug: string): EndpointDef | undefined {
  return BY_SLUG.get(stripSlashes(slug));
}

export function getById(id: string): EndpointDef | undefined {
  return BY_ID.get(id);
}

/**
 * Resolve an incoming request path to an endpoint, peeling off trailing path
 * params. `serp/google/organic/task_get/regular/0101-abc` resolves to the
 * `.../task_get/regular` endpoint with `{ id: "0101-abc" }`.
 *
 * Returns undefined rather than throwing so callers can 404 before charging.
 */
export function resolvePath(
  segments: readonly string[],
): { endpoint: EndpointDef; pathParams: Record<string, string> } | undefined {
  const full = segments.join("/");

  const exact = BY_SLUG.get(full);
  if (exact && exact.pathParams.length === 0) {
    return { endpoint: exact, pathParams: {} };
  }

  // Peel trailing segments to match an endpoint that declares path params.
  // Longest prefix wins, so `task_get/advanced/{id}` beats a shorter collision.
  for (let take = segments.length - 1; take > 0; take--) {
    const candidate = BY_SLUG.get(segments.slice(0, take).join("/"));
    if (!candidate) continue;
    const rest = segments.slice(take);
    if (rest.length !== candidate.pathParams.length) continue;

    const pathParams: Record<string, string> = {};
    candidate.pathParams.forEach((name, i) => (pathParams[name] = rest[i]));
    return { endpoint: candidate, pathParams };
  }

  // An exact slug match that declares path params but was given none is not a
  // match — proxying it upstream would drop the task id.
  return undefined;
}

/**
 * Resolve a path reachable by an external caller. Internal endpoints resolve to
 * undefined here so the public route 404s them rather than proxying a
 * cross-tenant read. Server-side callers use {@link resolvePath} directly.
 */
export function resolvePublicPath(
  segments: readonly string[],
): { endpoint: EndpointDef; pathParams: Record<string, string> } | undefined {
  const hit = resolvePath(segments);
  return hit && hit.endpoint.exposure === "public" ? hit : undefined;
}

export function listGroups(): string[] {
  return [...new Set(ENDPOINTS.map((e) => e.group))].sort();
}

export function getByGroup(group: string): EndpointDef[] {
  return ENDPOINTS.filter((e) => e.group === group);
}

export function listBillable(): EndpointDef[] {
  return ENDPOINTS.filter((e) => e.billable);
}

/** Free-text search across slug and description, for the explorer UI. */
export function searchEndpoints(query: string, limit = 50): EndpointDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ENDPOINTS.filter(
    (e) => e.slug.toLowerCase().includes(q) || e.description.toLowerCase().includes(q),
  ).slice(0, limit);
}

/**
 * Missing required params, checked *before* any payment is taken so a malformed
 * request is rejected free of charge.
 */
export function missingRequired(endpoint: EndpointDef, body: Record<string, unknown>): string[] {
  return endpoint.required.filter((name) => body[name] === undefined || body[name] === null);
}

function stripSlashes(s: string): string {
  return s.replace(/^\/+|\/+$/g, "");
}
