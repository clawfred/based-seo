/**
 * The single door to DataForSEO.
 *
 * Two invariants this module exists to hold:
 *
 *  1. It never invents data. There is no mock fallback here. The previous code
 *     settled payment and then, if credentials were missing, returned fabricated
 *     SEO results — the caller paid real USDC for made-up numbers. Callers must
 *     check `hasCredentials()` and refuse to charge before ever reaching here.
 *
 *  2. It reports failure precisely enough for the payment layer to decide
 *     whether the caller owes anything. `DataForSEORequestError` is the caller's
 *     fault; `DataForSEOUpstreamError` is ours. Neither is billable.
 */

import {
  DFS_OK,
  DFS_TASK_CREATED,
  DataForSEOAuthError,
  DataForSEOUpstreamError,
  classifyStatus,
} from "./errors";

const LIVE_HOST = "https://api.dataforseo.com";
const SANDBOX_HOST = "https://sandbox.dataforseo.com";

/**
 * Sandbox returns correctly-shaped dummy payloads and never bills the account.
 * It is opt-in: a missing var means production, because silently pointing prod
 * traffic at fake data is worse than an env error.
 */
export function isSandbox(): boolean {
  return process.env.DATAFORSEO_ENV === "sandbox";
}

export function getHost(): string {
  return isSandbox() ? SANDBOX_HOST : LIVE_HOST;
}

export function hasCredentials(): boolean {
  return Boolean(process.env.DATAFORSEO_USERNAME && process.env.DATAFORSEO_PASSWORD);
}

function authHeader(): string {
  const user = process.env.DATAFORSEO_USERNAME;
  const pass = process.env.DATAFORSEO_PASSWORD;
  if (!user || !pass) throw new DataForSEOAuthError();
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

export interface DataForSEOTask {
  readonly id?: string;
  readonly status_code: number;
  readonly status_message: string;
  readonly cost?: number;
  readonly result?: unknown[] | null;
  readonly result_count?: number;
}

export interface DataForSEOEnvelope {
  readonly status_code: number;
  readonly status_message: string;
  /** What DataForSEO actually billed us. Reconcile against our quote. */
  readonly cost: number;
  readonly tasks?: DataForSEOTask[];
  readonly tasks_error?: number;
}

export interface CallOptions {
  /** Upstream path including `/v3`, e.g. `/v3/backlinks/summary/live`. */
  readonly dfsPath: string;
  readonly method: "POST" | "GET";
  /** Array of task objects for POST. DataForSEO bills per element. */
  readonly tasks?: readonly Record<string, unknown>[];
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Call DataForSEO and return the envelope only if the work actually succeeded.
 *
 * Throws rather than returning a degraded result, so a caller that reaches the
 * settle/capture step knows the data is real.
 */
export async function callDataForSEO(opts: CallOptions): Promise<DataForSEOEnvelope> {
  if (!hasCredentials()) {
    throw new DataForSEOAuthError(
      "DataForSEO credentials are not configured; refusing to serve a paid request.",
    );
  }

  const url = `${getHost()}${opts.dfsPath}`;
  const timeout = AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(url, {
      method: opts.method,
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: opts.method === "POST" ? JSON.stringify(opts.tasks ?? [{}]) : undefined,
      signal,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new DataForSEOUpstreamError(`DataForSEO unreachable: ${reason}`);
  }

  if (response.status === 401) throw new DataForSEOAuthError();
  if (response.status === 404) {
    throw new DataForSEOUpstreamError(`DataForSEO has no endpoint at ${opts.dfsPath}`, 404);
  }

  let envelope: DataForSEOEnvelope;
  try {
    envelope = (await response.json()) as DataForSEOEnvelope;
  } catch {
    throw new DataForSEOUpstreamError(`DataForSEO returned non-JSON (HTTP ${response.status})`);
  }

  // DataForSEO signals failure in the body, not the HTTP status: a 200 envelope
  // routinely carries an error status_code.
  if (envelope.status_code !== DFS_OK) {
    throw classifyStatus(envelope.status_code, envelope.status_message);
  }

  return envelope;
}

/**
 * Call an endpoint carrying exactly one task and return that task, verifying it
 * succeeded. Most `live` endpoints are used this way.
 */
export async function callSingleTask(opts: CallOptions): Promise<DataForSEOTask> {
  const envelope = await callDataForSEO(opts);
  const task = envelope.tasks?.[0];

  if (!task) {
    throw new DataForSEOUpstreamError("DataForSEO returned an envelope with no tasks");
  }
  // 20100 = "Task Created": correct and terminal for task_post.
  if (task.status_code !== DFS_OK && task.status_code !== DFS_TASK_CREATED) {
    throw classifyStatus(task.status_code, task.status_message);
  }

  return task;
}

/** Build the upstream URL for an endpoint that takes trailing path params. */
export function buildPath(dfsPath: string, pathParams: readonly string[]): string {
  return pathParams.length ? `${dfsPath}/${pathParams.join("/")}` : dfsPath;
}
