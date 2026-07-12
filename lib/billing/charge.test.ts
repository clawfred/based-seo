/**
 * Regression test for the paid-task-loss bug: on an async task_post, if
 * persisting the tenant-scoped task fails AFTER DataForSEO returns a task id,
 * the caller must NOT be charged. The fix makes persistence part of the charged
 * work, so a throw releases the hold before capture. This asserts exactly that.
 */

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

import { chargeAndRun, type ChargeContext, type Chargeable } from "./charge";
import { getBalance, holdFunds, type LedgerDb } from "./ledger";

const SCHEMA = `
CREATE TABLE ledger_entries (
  id text PRIMARY KEY, account_id text NOT NULL, user_id text, payer_address text,
  entry_type text NOT NULL, amount_micros bigint NOT NULL, request_id text,
  related_entry_id text, status text, endpoint text, onchain_tx_hash text,
  block_number bigint, log_index bigint, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz
);
CREATE UNIQUE INDEX ledger_hold_idempotency ON ledger_entries (account_id, request_id)
  WHERE entry_type = 'debit_hold' AND request_id IS NOT NULL;
CREATE TABLE account_balances (
  account_id text PRIMARY KEY, balance_micros bigint NOT NULL DEFAULT 0,
  floor_micros bigint NOT NULL DEFAULT 0, state text NOT NULL DEFAULT 'active',
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;

const ACCOUNT = "user_1";

// hasCredentials() must be true or chargeAndRun short-circuits to a 503.
process.env.DATAFORSEO_USERNAME ??= "test-user";
process.env.DATAFORSEO_PASSWORD ??= "test-pass";

let pg: PGlite;
let db: LedgerDb;

beforeEach(async () => {
  pg = new PGlite();
  await pg.exec(SCHEMA);
  db = drizzle(pg) as unknown as LedgerDb;
  await pg.query(
    `INSERT INTO account_balances (account_id, balance_micros, floor_micros) VALUES ($1, 100000, 0)`,
    [ACCOUNT],
  );
});

/** A request with no PAYMENT-SIGNATURE header, so the balance rail is chosen. */
function fakeRequest(): NextRequest {
  return {
    headers: new Headers(),
    url: "http://localhost/api/v3/serp/google/organic/task_post",
    method: "POST",
  } as unknown as NextRequest;
}

const quote: Chargeable = {
  slug: "serp/google/organic/task_post",
  billable: true,
  isTaskPost: true,
  micros: 3_000,
  formatted: "$0.003",
  body: [{}],
};

function ctx(): ChargeContext {
  return { req: fakeRequest(), quote, accountId: ACCOUNT, idempotencyKey: "req-1", db };
}

async function captureCount(): Promise<number> {
  const { rows } = await pg.query(
    `SELECT count(*)::int AS n FROM ledger_entries WHERE entry_type = 'debit_capture'`,
  );
  return (rows[0] as { n: number }).n;
}

describe("chargeAndRun — persistence failure must not charge", () => {
  it("releases the hold and takes no capture when the work throws after DataForSEO succeeds", async () => {
    // Simulates: DataForSEO returned a task id, then createTask threw (bad db,
    // constraint, or a misconfigured capability secret).
    const work = async () => {
      // stand-in for "DataForSEO call succeeded, now persist" then boom
      throw new Error("createTask failed: capability secret missing");
    };

    await expect(chargeAndRun(ctx(), work)).rejects.toThrow(/createTask failed/);

    // The money never moved: balance restored, no capture row.
    expect(await getBalance(db, ACCOUNT)).toBe(100_000n);
    expect(await captureCount()).toBe(0);
  });

  it("captures exactly once when the work (including persistence) succeeds", async () => {
    const work = async () => ({ id: "our-task", status: "posted", capabilityToken: "tok" });

    const { charge, value } = await chargeAndRun(ctx(), work);

    expect(charge.ok).toBe(true);
    expect(charge.ok && charge.source).toBe("balance");
    expect(value).toMatchObject({ id: "our-task" });
    expect(await getBalance(db, ACCOUNT)).toBe(97_000n); // charged once
    expect(await captureCount()).toBe(1);
  });

  it("does not leave a lingering hold after a failed work", async () => {
    await expect(
      chargeAndRun(ctx(), async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow();

    const { rows } = await pg.query(
      `SELECT count(*)::int AS n FROM ledger_entries WHERE status = 'held'`,
    );
    expect((rows[0] as { n: number }).n).toBe(0);

    // A subsequent request with a fresh key still succeeds (balance intact).
    const held = await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 3_000n,
      endpoint: "e",
      requestId: "req-2",
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(held.ok).toBe(true);
  });
});
