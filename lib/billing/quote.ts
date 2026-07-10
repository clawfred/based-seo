/**
 * Turn a request into a price, and — critically — into the exact payload that
 * will be forwarded upstream.
 *
 * DataForSEO bills per task in the submitted array. If we priced from one field
 * and forwarded the caller's raw body, a caller could pay for one task and
 * submit twenty. So pricing and forwarding both read from a single validated
 * object: `quoteRequest` returns the tasks it priced, and the route handler must
 * send *those*, never the original body.
 */

import type { Chargeable } from "@/lib/billing/charge";
import { API_PREFIX } from "@/lib/x402/constants";
import { missingRequired, resolvePublicPath, type EndpointDef } from "@/lib/registry";
import { quoteBatch, type PriceQuote } from "@/lib/registry/pricing";

/** DataForSEO caps a queued POST at 100 tasks and a live POST at 1. */
const MAX_TASKS_LIVE = 1;
const MAX_TASKS_QUEUED = 100;

export class QuoteError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "QuoteError";
    this.status = status;
  }
}

export interface RequestQuote extends PriceQuote, Chargeable {
  readonly endpoint: EndpointDef;
  readonly pathParams: Record<string, string>;
  /** The validated tasks. Forward exactly these; never the raw body. */
  readonly tasks: readonly Record<string, unknown>[];
}

export function maxTasksFor(endpoint: EndpointDef): number {
  return endpoint.mode === "live" ? MAX_TASKS_LIVE : MAX_TASKS_QUEUED;
}

/** Path segments after `/api/v3/`. */
export function segmentsFromPath(path: string): string[] {
  const rest = path.startsWith(API_PREFIX) ? path.slice(API_PREFIX.length) : path;
  return rest.split("/").filter(Boolean);
}

/**
 * Normalize a request body into an array of task objects.
 *
 * DataForSEO always takes an array. Callers may send a bare object for the
 * common single-task case; both shapes are accepted, and both are re-serialized
 * from here so nothing unvalidated reaches upstream.
 */
export function normalizeTasks(body: unknown): Record<string, unknown>[] {
  if (body === undefined || body === null) return [{}];
  if (Array.isArray(body)) {
    for (const t of body) {
      if (typeof t !== "object" || t === null || Array.isArray(t)) {
        throw new QuoteError("Each task must be a JSON object", 400);
      }
    }
    return body as Record<string, unknown>[];
  }
  if (typeof body === "object") return [body as Record<string, unknown>];
  throw new QuoteError("Request body must be a JSON object or an array of them", 400);
}

/**
 * Price a request. Throws `QuoteError` for anything the caller got wrong, so the
 * route rejects it *before* issuing a 402 or taking a hold — a malformed request
 * is always free.
 */
export function quoteFor(segments: readonly string[], body: unknown): RequestQuote {
  const hit = resolvePublicPath(segments);
  if (!hit) throw new QuoteError(`No endpoint at /${segments.join("/")}`, 404);

  const { endpoint, pathParams } = hit;
  const tasks = normalizeTasks(body);

  const limit = maxTasksFor(endpoint);
  if (tasks.length > limit) {
    throw new QuoteError(
      `${endpoint.slug} accepts at most ${limit} task${limit === 1 ? "" : "s"} per request, got ${tasks.length}`,
      400,
    );
  }

  // Required-param presence, checked per task, before any money moves.
  tasks.forEach((task, i) => {
    const missing = missingRequired(endpoint, task);
    if (missing.length) {
      throw new QuoteError(
        `Task ${i} is missing required param${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`,
        400,
      );
    }
  });

  const price = quoteBatch(endpoint, tasks.length);
  return {
    ...price,
    endpoint,
    pathParams,
    tasks,
    slug: endpoint.slug,
    billable: endpoint.billable,
    isTaskPost: endpoint.mode === "task_post",
    // x402 must price the validated tasks, not the caller's raw body.
    body: tasks,
  };
}
