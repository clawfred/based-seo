/**
 * Server-side retrieval of a finished DataForSEO task.
 *
 * A `task_post` endpoint like `serp/google/organic/task_post` has a matching
 * retrieval endpoint `serp/google/organic/task_get/advanced/{id}`. We look that
 * up in the registry (preferring the richest variant), call it with our stored
 * DataForSEO id, and return the result — or null if the task is not ready yet.
 *
 * This runs only on the server, using our credentials against our own account.
 * The client never sees the DataForSEO id.
 */

import { ENDPOINTS, type EndpointDef } from "@/lib/registry";
import { callDataForSEO, buildPath } from "@/lib/dataforseo/client";
import { DFS_OK, DataForSEORequestError } from "@/lib/dataforseo/errors";

/** Retrieval variant preference: advanced carries the most data. */
const VARIANT_ORDER = ["advanced", "regular", "html", "json"];

/**
 * The `task_get` endpoint that retrieves results for a given `task_post` slug.
 * `serp/google/organic/task_post` -> `serp/google/organic/task_get/advanced`.
 */
export function retrievalEndpointFor(postSlug: string): EndpointDef | undefined {
  const base = postSlug.replace(/\/task_post$/, "");
  const candidates = ENDPOINTS.filter(
    (e) => e.slug === `${base}/task_get` || e.slug.startsWith(`${base}/task_get/`),
  );
  if (candidates.length === 0) return undefined;

  // Prefer the richest variant; fall back to a bare task_get.
  for (const variant of VARIANT_ORDER) {
    const hit = candidates.find((e) => e.slug === `${base}/task_get/${variant}`);
    if (hit) return hit;
  }
  return candidates.find((e) => e.slug === `${base}/task_get`) ?? candidates[0];
}

export type FetchOutcome =
  | { status: "ready"; result: unknown }
  | { status: "pending" }
  | { status: "no-retrieval" };

/**
 * Fetch a task's result from DataForSEO. Returns `pending` while the task is
 * still queued (DataForSEO reports task-created / not-found-yet), `ready` with
 * the result once complete.
 */
export async function fetchTaskResult(postSlug: string, dfsTaskId: string): Promise<FetchOutcome> {
  const retrieval = retrievalEndpointFor(postSlug);
  if (!retrieval) return { status: "no-retrieval" };

  let envelope;
  try {
    envelope = await callDataForSEO({
      dfsPath: buildPath(retrieval.dfsPath, [dfsTaskId]),
      method: "GET",
    });
  } catch (err) {
    // A queued or not-yet-registered task can 404 at task_get; that is "not
    // ready", not a failure. Anything else is a real error and propagates.
    if (err instanceof DataForSEORequestError) return { status: "pending" };
    throw err;
  }

  const task = envelope.tasks?.[0];
  // Ready only when the task itself succeeded and carries a result.
  if (!task || task.status_code !== DFS_OK || !task.result || (task.result_count ?? 0) === 0) {
    return { status: "pending" };
  }

  return { status: "ready", result: task.result };
}
