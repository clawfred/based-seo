import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import {
  mintCapabilityToken,
  verifyCapabilityToken,
  verifyWebhookSecret,
  webhookSecretFor,
} from "./capability";
import { createTask, getTask, getTaskByDfsId, isAuthorizedFor, markReady } from "./tasks";
import type { LedgerDb } from "./ledger";

// Deterministic secret so the HMAC is stable across the run.
process.env.CAPABILITY_TOKEN_SECRET = "test-secret-please-change";

const SCHEMA = `
CREATE TABLE tasks (
  id text PRIMARY KEY, account_id text NOT NULL, dfs_task_id text NOT NULL,
  endpoint text NOT NULL, charge_ref text, status text NOT NULL DEFAULT 'posted',
  result_key text, capability_token_hash text,
  posted_at timestamptz NOT NULL DEFAULT now(), deadline_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX tasks_dfs_id ON tasks (dfs_task_id);
`;

let pg: PGlite;
let db: LedgerDb;

beforeEach(async () => {
  pg = new PGlite();
  await pg.exec(SCHEMA);
  db = drizzle(pg) as unknown as LedgerDb;
});

describe("capability tokens", () => {
  it("verifies a token only for the task it names", () => {
    const { token } = mintCapabilityToken("task-abc");
    expect(verifyCapabilityToken(token, "task-abc")).toBe(true);
    expect(verifyCapabilityToken(token, "task-xyz")).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const { token } = mintCapabilityToken("task-abc");
    const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");
    expect(verifyCapabilityToken(tampered, "task-abc")).toBe(false);
  });

  it("rejects an expired token", () => {
    const { token } = mintCapabilityToken("task-abc", -1_000); // already expired
    expect(verifyCapabilityToken(token, "task-abc")).toBe(false);
  });

  it("rejects a malformed token", () => {
    expect(verifyCapabilityToken("garbage", "task-abc")).toBe(false);
    expect(verifyCapabilityToken("", "task-abc")).toBe(false);
  });

  it("derives a stable, task-bound webhook secret", () => {
    const secret = webhookSecretFor("task-abc");
    expect(verifyWebhookSecret("task-abc", secret)).toBe(true);
    expect(verifyWebhookSecret("task-xyz", secret)).toBe(false);
    expect(verifyWebhookSecret("task-abc", "wrong")).toBe(false);
  });
});

describe("createTask + retrieval", () => {
  it("stores the DataForSEO id privately and returns our id + token", async () => {
    const created = await createTask(db, {
      accountId: "user_1",
      dfsTaskId: "0101-dfs-secret",
      endpoint: "serp/google/organic/task_post",
      chargeRef: "x402",
    });

    expect(created.id).not.toBe("0101-dfs-secret");
    expect(created.status).toBe("posted");
    expect(verifyCapabilityToken(created.capabilityToken, created.id)).toBe(true);

    const row = await getTask(db, created.id);
    expect(row?.dfsTaskId).toBe("0101-dfs-secret");
    expect(row?.accountId).toBe("user_1");
  });

  it("finds a task by DataForSEO id for the webhook path", async () => {
    const created = await createTask(db, {
      accountId: "user_1",
      dfsTaskId: "0101-dfs",
      endpoint: "serp/google/organic/task_post",
      chargeRef: null,
    });
    const byDfs = await getTaskByDfsId(db, "0101-dfs");
    expect(byDfs?.id).toBe(created.id);
  });
});

describe("isAuthorizedFor — cross-tenant guard", () => {
  it("admits the owning session account", async () => {
    const created = await createTask(db, {
      accountId: "owner",
      dfsTaskId: "d1",
      endpoint: "serp/google/organic/task_post",
      chargeRef: null,
    });
    const task = (await getTask(db, created.id))!;
    expect(isAuthorizedFor(task, { accountId: "owner" })).toBe(true);
  });

  it("rejects a different account", async () => {
    const created = await createTask(db, {
      accountId: "owner",
      dfsTaskId: "d1",
      endpoint: "serp/google/organic/task_post",
      chargeRef: null,
    });
    const task = (await getTask(db, created.id))!;
    expect(isAuthorizedFor(task, { accountId: "attacker" })).toBe(false);
    expect(isAuthorizedFor(task, {})).toBe(false);
  });

  it("admits a valid capability token but not one for another task", async () => {
    const a = await createTask(db, {
      accountId: "owner",
      dfsTaskId: "d1",
      endpoint: "e",
      chargeRef: null,
    });
    const b = await createTask(db, {
      accountId: "owner",
      dfsTaskId: "d2",
      endpoint: "e",
      chargeRef: null,
    });
    const taskA = (await getTask(db, a.id))!;

    expect(isAuthorizedFor(taskA, { capabilityToken: a.capabilityToken })).toBe(true);
    // b's token must not unlock a — this is the cross-tenant leak we prevent.
    expect(isAuthorizedFor(taskA, { capabilityToken: b.capabilityToken })).toBe(false);
  });
});

describe("markReady", () => {
  it("advances a posted task to ready with its result key", async () => {
    const created = await createTask(db, {
      accountId: "u",
      dfsTaskId: "d",
      endpoint: "e",
      chargeRef: null,
    });
    await markReady(db, created.id, `task:${created.id}`);
    const row = await getTask(db, created.id);
    expect(row?.status).toBe("ready");
    expect(row?.resultKey).toBe(`task:${created.id}`);
  });
});
