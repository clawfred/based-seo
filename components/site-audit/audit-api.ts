/**
 * Network layer for Site Audit. Stateless helpers the lifecycle hook calls.
 *
 * The flow is unusual: the OnPage crawl is asynchronous. We pay ONCE to start it
 * (`startCrawl`, x402), get back OUR task id + a capability token, then poll a
 * free tenant-scoped summary endpoint until the crawl finishes and pull the
 * result tables — all authorized by the capability token, never a crawl id.
 */

import type { WalletClient } from "viem";
import { x402Fetch } from "@/lib/x402-client";
import type { AuditPage, AuditLink, AuditSummary } from "./audit-types";

const TASK_POST_SLUG = "on_page/task_post";

/** The 202 body from `on_page/task_post` (see app/api/v3/[...path]/route.ts). */
export interface StartedCrawl {
  taskId: string;
  capabilityToken: string;
}

export type StartResult =
  | { status: "started"; crawl: StartedCrawl }
  | { status: "payment_required" }
  | { status: "error"; message: string };

/**
 * Pay for and enqueue a crawl. With a wallet, `x402Fetch` settles the 402 and
 * retries; the success comes back HTTP 202 with the task envelope. Without a
 * wallet, a bare 402 surfaces as `payment_required` so the UI can prompt a pay.
 */
export async function startCrawl(
  target: string,
  maxCrawlPages: number,
  walletClient?: WalletClient,
): Promise<StartResult> {
  const url = `/api/v3/${TASK_POST_SLUG}`;
  const body = { target, max_crawl_pages: maxCrawlPages };

  try {
    const res = walletClient
      ? await x402Fetch(url, body, walletClient)
      : await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

    if (res.status === 402) return { status: "payment_required" };

    if (!res.ok) return { status: "error", message: await extractError(res) };

    // 202 body: { endpoint, price, task: { id, capabilityToken, resultUrl } }.
    const json = (await res.json()) as {
      task?: { id?: string; capabilityToken?: string };
    };
    const taskId = json.task?.id;
    const capabilityToken = json.task?.capabilityToken;
    if (!taskId || !capabilityToken) {
      return { status: "error", message: "The crawl started but returned no task handle." };
    }
    return { status: "started", crawl: { taskId, capabilityToken } };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Failed to start the crawl." };
  }
}

/** Shape of `/api/v3/audits/{id}/{resource}` responses. */
interface AuditEnvelope<T> {
  crawlProgress?: string;
  data?: T;
}

export interface SummaryPoll {
  crawlProgress: string;
  summary: AuditSummary | null;
}

/** Poll the free summary. `data` is an array; the crawl summary is `data[0]`. */
export async function fetchSummary(
  taskId: string,
  capabilityToken: string,
): Promise<SummaryPoll> {
  const json = await getResource<AuditSummary[]>(taskId, "summary", capabilityToken);
  const summary = Array.isArray(json.data) ? (json.data[0] ?? null) : null;
  const crawlProgress = json.crawlProgress ?? summary?.crawl_progress ?? "in_progress";
  return { crawlProgress, summary };
}

/** POST a result resource whose payload is `data[0].items` (pages, links, …). */
async function fetchItems<T>(
  taskId: string,
  resource: string,
  capabilityToken: string,
  limit: number,
): Promise<T[]> {
  const json = await postResource<{ items?: T[] }[]>(taskId, resource, capabilityToken, { limit });
  const first = Array.isArray(json.data) ? json.data[0] : undefined;
  return Array.isArray(first?.items) ? first.items : [];
}

export function fetchPages(
  taskId: string,
  capabilityToken: string,
  limit = 100,
): Promise<AuditPage[]> {
  return fetchItems<AuditPage>(taskId, "pages", capabilityToken, limit);
}

export function fetchLinks(
  taskId: string,
  capabilityToken: string,
  limit = 100,
): Promise<AuditLink[]> {
  return fetchItems<AuditLink>(taskId, "links", capabilityToken, limit);
}

async function getResource<T>(
  taskId: string,
  resource: string,
  capabilityToken: string,
): Promise<AuditEnvelope<T>> {
  const res = await fetch(`/api/v3/audits/${taskId}/${resource}`, {
    method: "GET",
    headers: { "x-capability-token": capabilityToken },
  });
  if (!res.ok) throw new Error(await extractError(res));
  return (await res.json()) as AuditEnvelope<T>;
}

async function postResource<T>(
  taskId: string,
  resource: string,
  capabilityToken: string,
  body: Record<string, unknown>,
): Promise<AuditEnvelope<T>> {
  const res = await fetch(`/api/v3/audits/${taskId}/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-capability-token": capabilityToken },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return (await res.json()) as AuditEnvelope<T>;
}

async function extractError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? `Request failed (${res.status}).`;
  } catch {
    return `Request failed (${res.status}).`;
  }
}
