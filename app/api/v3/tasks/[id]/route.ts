/**
 * GET /api/v3/tasks/{id}
 *
 * Tenant-scoped retrieval of an async task's result. The `id` is OUR id, not
 * DataForSEO's. Access requires either the authenticated session that posted the
 * task or the capability token issued at post time — nothing else, because the
 * result was paid for by exactly one customer.
 *
 * If the task is not yet marked ready, we lazily pull it from DataForSEO. This
 * keeps retrieval correct without depending on the postback webhook (which can't
 * reach a dev server anyway).
 */

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/db";
import { checkRateLimit } from "@/lib/api-middleware";
import { verifyAuth } from "@/lib/auth";
import { getCachedResponse, setCachedResponse } from "@/lib/api-cache";
import { fetchTaskResult } from "@/lib/billing/task-fetch";
import { getTask, isAuthorizedFor, markFailed, markReady } from "@/lib/billing/tasks";
import { DataForSEOUpstreamError } from "@/lib/dataforseo/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const throttled = await checkRateLimit(req);
  if (throttled) return throttled;

  if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 503 });

  let task;
  try {
    task = await getTask(db, id);
  } catch (err) {
    console.error("[api/v3/tasks] task lookup failed", err);
    return NextResponse.json({ error: "STORAGE_UNAVAILABLE" }, { status: 503 });
  }
  if (!task) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Authorize by session account or capability token — never leak across tenants.
  const user = await verifyAuth(req);
  const capabilityToken =
    req.headers.get("x-capability-token") ?? req.nextUrl.searchParams.get("token");
  if (!isAuthorizedFor(task, { accountId: user?.userId, capabilityToken })) {
    // 404, not 403: don't confirm a task id exists to someone who can't read it.
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Already fetched: serve the stored result.
  if (task.status === "ready" && task.resultKey) {
    const cached = await getCachedResponse<unknown>(task.resultKey, { taskId: id });
    if (cached) {
      return NextResponse.json({ id, status: "ready", data: cached });
    }
  }
  if (task.status === "failed") {
    return NextResponse.json({ id, status: "failed" }, { status: 200 });
  }

  // Lazily pull from DataForSEO.
  try {
    const outcome = await fetchTaskResult(task.endpoint, task.dfsTaskId);

    if (outcome.status === "no-retrieval") {
      return NextResponse.json(
        { id, status: "error", message: "No retrieval endpoint for this task type." },
        { status: 502 },
      );
    }
    if (outcome.status === "pending") {
      return NextResponse.json({ id, status: "pending" });
    }

    // Ready: cache under a stable key and mark the task done.
    const resultKey = `task:${id}`;
    await setCachedResponse(resultKey, { taskId: id }, outcome.result, 24 * 30);
    await markReady(db, id, resultKey);
    return NextResponse.json({ id, status: "ready", data: outcome.result });
  } catch (err) {
    if (err instanceof DataForSEOUpstreamError) {
      await markFailed(db, id);
      return NextResponse.json({ id, status: "failed", message: err.message }, { status: 502 });
    }
    console.error("[api/v3/tasks] fetch failed", err);
    return NextResponse.json({ id, status: "error" }, { status: 500 });
  }
}
