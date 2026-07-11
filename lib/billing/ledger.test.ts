/**
 * Ledger tests run against real Postgres (PGlite, Postgres compiled to WASM),
 * not a mock. The behaviour under test — data-modifying CTEs, the guarded
 * UPDATE predicate, unique partial indexes, `RETURNING` semantics — is Postgres
 * behaviour. A fake would only test that the fake agrees with itself.
 */

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import {
  captureHold,
  getBalance,
  holdFunds,
  reconcile,
  releaseHold,
  sweepExpiredHolds,
  type LedgerDb,
} from "./ledger";

const SCHEMA = `
CREATE TABLE ledger_entries (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  user_id text,
  payer_address text,
  entry_type text NOT NULL,
  amount_micros bigint NOT NULL,
  request_id text,
  related_entry_id text,
  status text,
  endpoint text,
  onchain_tx_hash text,
  block_number bigint,
  log_index bigint,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
CREATE UNIQUE INDEX ledger_hold_idempotency ON ledger_entries (account_id, request_id)
  WHERE entry_type = 'debit_hold' AND request_id IS NOT NULL;
CREATE UNIQUE INDEX ledger_onchain_unique ON ledger_entries (onchain_tx_hash, log_index)
  WHERE onchain_tx_hash IS NOT NULL;

CREATE TABLE account_balances (
  account_id text PRIMARY KEY,
  balance_micros bigint NOT NULL DEFAULT 0,
  floor_micros bigint NOT NULL DEFAULT 0,
  state text NOT NULL DEFAULT 'active',
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;

const ACCOUNT = "user_alice";
const HOUR = 3_600_000;

let pg: PGlite;
let db: LedgerDb;

/**
 * Fund an account the way a real deposit does: the materialized balance AND a
 * matching ledger entry. Crediting the balance alone would make `reconcile`
 * report permanent drift, which is exactly what it is supposed to detect.
 */
async function seed(balanceMicros: bigint, floorMicros = 0n, state = "active") {
  await pg.query(
    `INSERT INTO account_balances (account_id, balance_micros, floor_micros, state)
     VALUES ($1, $2, $3, $4)`,
    [ACCOUNT, balanceMicros.toString(), floorMicros.toString(), state],
  );
  if (balanceMicros !== 0n) {
    await pg.query(
      `INSERT INTO ledger_entries (id, account_id, entry_type, amount_micros)
       VALUES ($1, $2, 'deposit', $3)`,
      [`seed-${ACCOUNT}`, ACCOUNT, balanceMicros.toString()],
    );
  }
}

const future = () => new Date(Date.now() + HOUR);
const past = () => new Date(Date.now() - HOUR);

beforeEach(async () => {
  pg = new PGlite();
  await pg.exec(SCHEMA);
  // Drizzle's own PGlite driver, so the tests exercise the real SQL rendering
  // path rather than a hand-rolled reimplementation of it.
  db = drizzle(pg) as unknown as LedgerDb;
});

describe("holdFunds", () => {
  it("decrements the balance and records a held entry", async () => {
    await seed(10_000n);
    const res = await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 3_000n,
      endpoint: "backlinks/summary/live",
      requestId: "req-1",
      expiresAt: future(),
    });

    expect(res.ok).toBe(true);
    expect(await getBalance(db, ACCOUNT)).toBe(7_000n);
  });

  it("refuses to overdraw past the floor", async () => {
    await seed(1_000n);
    const res = await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 3_000n,
      endpoint: "e",
      requestId: "req-1",
      expiresAt: future(),
    });

    expect(res).toEqual({ ok: false, reason: "insufficient_funds" });
    expect(await getBalance(db, ACCOUNT)).toBe(1_000n);
  });

  it("allows spending into a negative balance when a tab floor permits it", async () => {
    await seed(0n, -5_000n);
    const res = await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 3_000n,
      endpoint: "e",
      requestId: "req-1",
      expiresAt: future(),
    });

    expect(res.ok).toBe(true);
    expect(await getBalance(db, ACCOUNT)).toBe(-3_000n);
  });

  it("refuses a suspended account", async () => {
    await seed(10_000n, 0n, "suspended");
    const res = await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 1_000n,
      endpoint: "e",
      requestId: "req-1",
      expiresAt: future(),
    });

    expect(res).toEqual({ ok: false, reason: "insufficient_funds" });
    expect(await getBalance(db, ACCOUNT)).toBe(10_000n);
  });

  it("writes no ledger row when the guard rejects the debit", async () => {
    await seed(100n);
    await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 5_000n,
      endpoint: "e",
      requestId: "req-1",
      expiresAt: future(),
    });
    const { rows } = await pg.query(
      `SELECT count(*)::int AS n FROM ledger_entries WHERE entry_type = 'debit_hold'`,
    );
    expect((rows[0] as { n: number }).n).toBe(0);
  });

  it("charges an idempotency key exactly once", async () => {
    await seed(10_000n);
    const args = {
      accountId: ACCOUNT,
      priceMicros: 3_000n,
      endpoint: "e",
      requestId: "same-key",
      expiresAt: future(),
    };

    const first = await holdFunds(db, args);
    const second = await holdFunds(db, args);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(second.ok === false && second.reason).toBe("duplicate_request");
    // Balance moved once, not twice.
    expect(await getBalance(db, ACCOUNT)).toBe(7_000n);
  });

  it("lets distinct idempotency keys both charge", async () => {
    await seed(10_000n);
    const base = { accountId: ACCOUNT, priceMicros: 3_000n, endpoint: "e", expiresAt: future() };
    await holdFunds(db, { ...base, requestId: "k1" });
    await holdFunds(db, { ...base, requestId: "k2" });
    expect(await getBalance(db, ACCOUNT)).toBe(4_000n);
  });

  it("rejects a non-positive price", async () => {
    await seed(10_000n);
    await expect(
      holdFunds(db, {
        accountId: ACCOUNT,
        priceMicros: 0n,
        endpoint: "e",
        requestId: null,
        expiresAt: future(),
      }),
    ).rejects.toThrow(RangeError);
  });
});

/**
 * The failure this whole design exists to prevent: an agent fans out N calls,
 * each checks the balance, each sees enough, all N spend it.
 */
describe("concurrent debits cannot double-spend", () => {
  it("admits only as many holds as the balance funds", async () => {
    await seed(10_000n); // funds exactly 3 holds of 3,000
    const attempts = Array.from({ length: 12 }, (_, i) =>
      holdFunds(db, {
        accountId: ACCOUNT,
        priceMicros: 3_000n,
        endpoint: "e",
        requestId: `req-${i}`,
        expiresAt: future(),
      }),
    );

    const results = await Promise.all(attempts);
    const granted = results.filter((r) => r.ok);
    const denied = results.filter((r) => !r.ok);

    expect(granted).toHaveLength(3);
    expect(denied).toHaveLength(9);
    expect(await getBalance(db, ACCOUNT)).toBe(1_000n);
  });

  it("never lets the balance fall below the floor under contention", async () => {
    await seed(5_000n);
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        holdFunds(db, {
          accountId: ACCOUNT,
          priceMicros: 1_000n,
          endpoint: "e",
          requestId: `r${i}`,
          expiresAt: future(),
        }),
      ),
    );
    const balance = await getBalance(db, ACCOUNT);
    expect(balance).toBeGreaterThanOrEqual(0n);
    expect(balance).toBe(0n);
  });
});

describe("captureHold / releaseHold", () => {
  async function openHold(priceMicros = 3_000n, expiresAt = future()) {
    await seed(10_000n);
    const res = await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros,
      endpoint: "e",
      requestId: "req-1",
      expiresAt,
    });
    if (!res.ok) throw new Error("setup failed");
    return res.hold.holdId;
  }

  it("capture keeps the money and is idempotent", async () => {
    const holdId = await openHold();
    expect(await captureHold(db, holdId)).toBe(true);
    expect(await getBalance(db, ACCOUNT)).toBe(7_000n);

    // A retried capture must not double-charge.
    expect(await captureHold(db, holdId)).toBe(false);
    expect(await getBalance(db, ACCOUNT)).toBe(7_000n);
  });

  it("release returns the money and is idempotent", async () => {
    const holdId = await openHold();
    expect(await releaseHold(db, holdId)).toBe(true);
    expect(await getBalance(db, ACCOUNT)).toBe(10_000n);

    // A retried release must not double-refund.
    expect(await releaseHold(db, holdId)).toBe(false);
    expect(await getBalance(db, ACCOUNT)).toBe(10_000n);
  });

  it("capture and release are mutually exclusive", async () => {
    const holdId = await openHold();
    expect(await captureHold(db, holdId)).toBe(true);
    // The sweeper racing a slow success must lose.
    expect(await releaseHold(db, holdId)).toBe(false);
    expect(await getBalance(db, ACCOUNT)).toBe(7_000n);
  });

  it("a released hold cannot later be captured", async () => {
    const holdId = await openHold();
    expect(await releaseHold(db, holdId)).toBe(true);
    // Upstream finally succeeded, but we already refunded: capture must fail so
    // the caller knows not to serve the paid result.
    expect(await captureHold(db, holdId)).toBe(false);
    expect(await getBalance(db, ACCOUNT)).toBe(10_000n);
  });

  it("capturing an unknown hold is a no-op", async () => {
    await seed(10_000n);
    expect(await captureHold(db, "nope")).toBe(false);
  });
});

describe("sweepExpiredHolds", () => {
  it("releases holds past their deadline and restores the balance", async () => {
    await seed(10_000n);
    await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 3_000n,
      endpoint: "e",
      requestId: "stale",
      expiresAt: past(),
    });
    expect(await getBalance(db, ACCOUNT)).toBe(7_000n);

    expect(await sweepExpiredHolds(db)).toBe(1);
    expect(await getBalance(db, ACCOUNT)).toBe(10_000n);
  });

  it("leaves live holds alone", async () => {
    await seed(10_000n);
    await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 3_000n,
      endpoint: "e",
      requestId: "fresh",
      expiresAt: future(),
    });

    expect(await sweepExpiredHolds(db)).toBe(0);
    expect(await getBalance(db, ACCOUNT)).toBe(7_000n);
  });

  it("cannot double-refund a hold the handler already released", async () => {
    await seed(10_000n);
    const res = await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 3_000n,
      endpoint: "e",
      requestId: "raced",
      expiresAt: past(),
    });
    if (!res.ok) throw new Error("setup");

    await releaseHold(db, res.hold.holdId);
    expect(await sweepExpiredHolds(db)).toBe(0);
    expect(await getBalance(db, ACCOUNT)).toBe(10_000n);
  });

  it("scopes to one account when given an accountId", async () => {
    // Two accounts, each with an expired hold.
    await seed(10_000n);
    await pg.query(
      `INSERT INTO account_balances (account_id, balance_micros, floor_micros, state)
       VALUES ('other', 10000, 0, 'active')`,
    );
    await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 3_000n,
      endpoint: "e",
      requestId: "mine",
      expiresAt: past(),
    });
    await holdFunds(db, {
      accountId: "other",
      priceMicros: 3_000n,
      endpoint: "e",
      requestId: "theirs",
      expiresAt: past(),
    });

    // Sweeping only ACCOUNT touches exactly one hold and restores only its balance.
    expect(await sweepExpiredHolds(db, new Date(), ACCOUNT)).toBe(1);
    expect(await getBalance(db, ACCOUNT)).toBe(10_000n);
    expect(await getBalance(db, "other")).toBe(7_000n);
  });
});

describe("reconcile", () => {
  it("reports zero drift after a capture", async () => {
    await seed(10_000n);
    const res = await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 3_000n,
      endpoint: "e",
      requestId: "r",
      expiresAt: future(),
    });
    if (!res.ok) throw new Error("setup");
    await captureHold(db, res.hold.holdId);

    const { drift } = await reconcile(db, ACCOUNT);
    expect(drift).toBe(0n);
  });

  it("reports zero drift after a release", async () => {
    await seed(10_000n);
    const res = await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 3_000n,
      endpoint: "e",
      requestId: "r",
      expiresAt: future(),
    });
    if (!res.ok) throw new Error("setup");
    await releaseHold(db, res.hold.holdId);

    const { drift, balanceMicros } = await reconcile(db, ACCOUNT);
    expect(balanceMicros).toBe(10_000n);
    expect(drift).toBe(0n);
  });
});
