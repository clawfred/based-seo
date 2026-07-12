/**
 * GET|POST /api/v3/audits/{id}/{resource}
 *
 * Tenant-scoped access to an OnPage crawl's results. `id` is OUR task id from
 * the on_page/task_post response; `resource` is one of summary, pages, links, …
 * We look up the caller's crawl, verify they own it, and inject THEIR crawl id
 * into the internal OnPage endpoint. A caller can never read a crawl they didn't
 * post — the crawl id is never accepted from the request.
 *
 * These result endpoints are free from DataForSEO (the crawl is billed at post
 * time), so no charge is taken here.
 */

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/db";
import { checkRateLimit } from "@/lib/api-middleware";
import { verifyAuth } from "@/lib/auth";
import { fetchAuditResource, isAuditResource } from "@/lib/billing/audit-fetch";
import { getTask, isAuthorizedFor } from "@/lib/billing/tasks";
import { DataForSEORequestError, DataForSEOUpstreamError } from "@/lib/dataforseo/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; resource: string }> };

export async function POST(req: NextRequest, ctx: Params) {
  return handle(req, ctx);
}
export async function GET(req: NextRequest, ctx: Params) {
  return handle(req, ctx);
}

async function handle(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { id, resource } = await params;

  const throttled = await checkRateLimit(req);
  if (throttled) return throttled;

  if (!isAuditResource(resource)) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: `Unknown audit resource "${resource}".` },
      { status: 400 },
    );
  }
  if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 503 });

  let task;
  try {
    task = await getTask(db, id);
  } catch (err) {
    // e.g. the billing tables haven't been migrated. A service issue, not the
    // caller's fault — 503, not a 500 that reads as a bug in their request.
    console.error("[api/v3/audits] task lookup failed", err);
    return NextResponse.json({ error: "STORAGE_UNAVAILABLE" }, { status: 503 });
  }
  if (!task || task.endpoint !== "on_page/task_post") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const user = await verifyAuth(req);
  const capabilityToken =
    req.headers.get("x-capability-token") ?? req.nextUrl.searchParams.get("token");
  if (!isAuthorizedFor(task, { accountId: user?.userId, capabilityToken })) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Extra params (limit, filters) are allowed; `id` is stripped so the caller
  // can never point us at another crawl.
  let extra: Record<string, unknown> = {};
  if (req.method === "POST") {
    try {
      const raw = await req.text();
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const { id: _ignored, ...rest } = parsed as Record<string, unknown>;
        extra = rest;
      }
    } catch {
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }
  }

  try {
    const { result, crawlProgress } = await fetchAuditResource(resource, task.dfsTaskId, extra);
    return NextResponse.json({ id, resource, crawlProgress, data: result });
  } catch (err) {
    if (err instanceof DataForSEORequestError) {
      return NextResponse.json(
        { error: "UPSTREAM_REJECTED", message: err.message },
        { status: 400 },
      );
    }
    if (err instanceof DataForSEOUpstreamError) {
      return NextResponse.json({ error: "UPSTREAM_ERROR", message: err.message }, { status: 502 });
    }
    console.error("[api/v3/audits] failed", err);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
