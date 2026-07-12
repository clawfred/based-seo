/**
 * Shape of a single DataForSEO endpoint as exposed by this platform.
 *
 * The registry is the one source of truth. The x402 price table, the API route
 * handler, the agent discovery manifest, and the explorer UI are all derived
 * from it — adding an endpoint is a data change, never a code change.
 */

/** DataForSEO's execution model for an endpoint. */
export type EndpointMode =
  | "live" // synchronous, result in the response
  | "task_post" // enqueue a job, pay here
  | "task_get" // fetch a finished job's result, free
  | "tasks_ready" // list finished-but-uncollected job ids, free
  | "post" // non-task POST utility (e.g. id_list, errors)
  | "get"; // non-task GET utility (e.g. locations, languages)

/**
 * Whether DataForSEO publishes a price for this endpoint. `estimated` means we
 * substituted the most expensive published price in its group, so we never
 * undercharge relative to what DataForSEO bills us. Surfaced to API consumers.
 */
export type PriceConfidence = "published" | "estimated";

/**
 * Whether an endpoint may be reached by an external caller.
 *
 * `internal` endpoints are reachable only from server-side code. Every endpoint
 * runs against our single DataForSEO account, so `task_get/{id}` returns results
 * for ANY id on that account and `tasks_ready` enumerates every customer's
 * pending task ids. Proxying either publicly is a cross-tenant IDOR. Customers
 * use our own tenant-scoped task endpoint instead.
 */
export type Exposure = "public" | "internal";

export interface EndpointDef {
  /** Stable snake_case identifier, e.g. `backlinks_summary_live`. */
  readonly id: string;
  /** DataForSEO path minus the `/v3/` prefix, e.g. `backlinks/summary/live`. */
  readonly slug: string;
  /** Full upstream path, e.g. `/v3/backlinks/summary/live`. */
  readonly dfsPath: string;
  readonly method: "POST" | "GET";
  readonly mode: EndpointMode;
  /** Human-facing API family, e.g. `Backlinks API`. */
  readonly group: string;

  /** What DataForSEO charges *us* per request, in USD. */
  readonly dfsCostUsd: number;
  readonly priceConfidence: PriceConfidence;

  /** True when a caller must pay to invoke this. */
  readonly billable: boolean;
  /** True for task_get / tasks_ready: the work was already paid for at task_post. */
  readonly freeRetrieval: boolean;
  /** Public passthrough, or server-side only. See {@link Exposure}. */
  readonly exposure: Exposure;
  /**
   * task_get returns results for ANY well-formed task id, including tasks paid
   * for by other customers. Endpoints flagged here MUST verify the caller owns
   * the task before proxying, or it's an IDOR across tenants.
   */
  readonly requiresTaskOwnership: boolean;

  /** Trailing URL segments, e.g. `["id"]` for `task_get/advanced/{id}`. */
  readonly pathParams: readonly string[];
  /** Required body params. Presence is checked before any charge is taken. */
  readonly required: readonly string[];
  /** Known optional body params. Unknown params pass through to DataForSEO. */
  readonly optional: readonly string[];

  readonly description: string;
}
