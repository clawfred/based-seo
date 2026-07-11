/**
 * Tenant-scoped async tasks.
 *
 * DataForSEO's task ids are secrets: `task_get/{id}` returns results for ANY id
 * on our single account. So we never expose a DataForSEO id to a client. When a
 * caller posts a task we mint OUR id, keep theirs private, and gate retrieval on
 * either the caller's session or a capability token bound to that one task.
 */

import { sql } from "drizzle-orm";

import { newId } from "@/lib/id";
import { mintCapabilityToken, verifyCapabilityToken, webhookSecretFor } from "./capability";
import type { LedgerDb } from "./ledger";

/** DataForSEO stores results for 30 days; a task may be fetched until then. */
const TASK_TTL_MS = 30 * 24 * 60 * 60_000;

function rows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return (result as { rows?: T[] })?.rows ?? [];
}

export interface CreatedTask {
  /** Our public id. The only task id a client ever sees. */
  id: string;
  /** Capability token — possession authorizes fetching this task's result. */
  capabilityToken: string;
  status: string;
  /** Random secret embedded in the postback URL; identifies the webhook caller. */
  webhookSecret: string;
}

/**
 * Record a task we just posted to DataForSEO. Returns our id and a capability
 * token for the caller.
 */
export async function createTask(
  db: LedgerDb,
  params: { accountId: string; dfsTaskId: string; endpoint: string; chargeRef: string | null },
): Promise<CreatedTask> {
  const id = newId();
  const cap = mintCapabilityToken(id, TASK_TTL_MS);
  const deadline = new Date(Date.now() + TASK_TTL_MS);

  await db.execute(sql`
    INSERT INTO tasks (id, account_id, dfs_task_id, endpoint, charge_ref, status,
                       capability_token_hash, posted_at, deadline_at)
    VALUES (${id}, ${params.accountId}, ${params.dfsTaskId}, ${params.endpoint},
            ${params.chargeRef}, 'posted', ${cap.hash}, now(), ${deadline.toISOString()}::timestamptz)
  `);

  return {
    id,
    capabilityToken: cap.token,
    status: "posted",
    webhookSecret: webhookSecretFor(id),
  };
}

export interface TaskRow {
  id: string;
  accountId: string;
  dfsTaskId: string;
  endpoint: string;
  status: string;
  resultKey: string | null;
  capabilityTokenHash: string | null;
}

function mapRow(r: Record<string, unknown>): TaskRow {
  return {
    id: r.id as string,
    accountId: r.account_id as string,
    dfsTaskId: r.dfs_task_id as string,
    endpoint: r.endpoint as string,
    status: r.status as string,
    resultKey: (r.result_key as string) ?? null,
    capabilityTokenHash: (r.capability_token_hash as string) ?? null,
  };
}

export async function getTask(db: LedgerDb, id: string): Promise<TaskRow | null> {
  const result = await db.execute(sql`SELECT * FROM tasks WHERE id = ${id}`);
  const row = rows<Record<string, unknown>>(result)[0];
  return row ? mapRow(row) : null;
}

/** Look up a task by DataForSEO's id — used by the webhook and poller only. */
export async function getTaskByDfsId(db: LedgerDb, dfsTaskId: string): Promise<TaskRow | null> {
  const result = await db.execute(sql`SELECT * FROM tasks WHERE dfs_task_id = ${dfsTaskId}`);
  const row = rows<Record<string, unknown>>(result)[0];
  return row ? mapRow(row) : null;
}

/**
 * Authorize a caller for a task. A matching session account OR a valid
 * capability token grants access; nothing else does.
 */
export function isAuthorizedFor(
  task: TaskRow,
  opts: { accountId?: string | null; capabilityToken?: string | null },
): boolean {
  if (opts.accountId && opts.accountId === task.accountId) return true;
  if (opts.capabilityToken) return verifyCapabilityToken(opts.capabilityToken, task.id);
  return false;
}

/** Record that a task's result has been fetched and stored. */
export async function markReady(db: LedgerDb, id: string, resultKey: string): Promise<void> {
  await db.execute(sql`
    UPDATE tasks SET status = 'ready', result_key = ${resultKey}
    WHERE id = ${id} AND status IN ('posted', 'ready')
  `);
}

export async function markFailed(db: LedgerDb, id: string): Promise<void> {
  await db.execute(sql`UPDATE tasks SET status = 'failed' WHERE id = ${id} AND status = 'posted'`);
}
