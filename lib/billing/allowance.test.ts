import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import { outstandingMicros, recordPull, syncTabAccount } from "./allowance";
import { captureHold, getBalance, holdFunds, type LedgerDb } from "./ledger";

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
CREATE UNIQUE INDEX ledger_onchain_unique ON ledger_entries (onchain_tx_hash, log_index)
  WHERE onchain_tx_hash IS NOT NULL;
CREATE TABLE account_balances (
  account_id text PRIMARY KEY, balance_micros bigint NOT NULL DEFAULT 0,
  floor_micros bigint NOT NULL DEFAULT 0, state text NOT NULL DEFAULT 'active',
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;

const ACCOUNT = "user_tab";
const future = () => new Date(Date.now() + 3_600_000);

let pg: PGlite;
let db: LedgerDb;

beforeEach(async () => {
  pg = new PGlite();
  await pg.exec(SCHEMA);
  db = drizzle(pg) as unknown as LedgerDb;
});

async function spend(micros: bigint, key: string) {
  const held = await holdFunds(db, {
    accountId: ACCOUNT,
    priceMicros: micros,
    endpoint: "e",
    requestId: key,
    expiresAt: future(),
  });
  if (!held.ok) throw new Error(`hold rejected: ${held.reason}`);
  await captureHold(db, held.hold.holdId);
}

describe("syncTabAccount", () => {
  it("opens a tab a user can immediately spend against", async () => {
    await syncTabAccount(db, ACCOUNT, 25_000); // $0.025 spendable
    expect(await getBalance(db, ACCOUNT)).toBe(0n);

    // Spend $0.02 of it — balance goes negative, a receivable.
    await spend(20_000n, "r1");
    expect(await getBalance(db, ACCOUNT)).toBe(-20_000n);
    expect(await outstandingMicros(db, ACCOUNT)).toBe(20_000n);
  });

  it("refuses spend past the tab cap", async () => {
    await syncTabAccount(db, ACCOUNT, 5_000);
    const held = await holdFunds(db, {
      accountId: ACCOUNT,
      priceMicros: 8_000n,
      endpoint: "e",
      requestId: "r1",
      expiresAt: future(),
    });
    expect(held).toEqual({ ok: false, reason: "insufficient_funds" });
  });

  it("raises the cap when the user approves more", async () => {
    await syncTabAccount(db, ACCOUNT, 5_000);
    await syncTabAccount(db, ACCOUNT, 50_000);
    // Now $0.03 is spendable where before it would have been refused.
    await spend(30_000n, "r1");
    expect(await getBalance(db, ACCOUNT)).toBe(-30_000n);
  });

  it("never lowers the floor above what is already owed", async () => {
    await syncTabAccount(db, ACCOUNT, 50_000);
    await spend(30_000n, "r1"); // balance now -30_000

    // User revokes down to $0.01 spendable, but they already owe $0.03.
    const { floorMicros } = await syncTabAccount(db, ACCOUNT, 10_000);
    // Floor cannot rise above the current balance (-30_000), or the receivable
    // would look unpayable.
    expect(floorMicros).toBe(-30_000n);
  });
});

describe("recordPull", () => {
  it("collects a receivable and moves the balance back toward zero", async () => {
    await syncTabAccount(db, ACCOUNT, 50_000);
    await spend(30_000n, "r1"); // owes 30_000
    expect(await outstandingMicros(db, ACCOUNT)).toBe(30_000n);

    const res = await recordPull(db, {
      accountId: ACCOUNT,
      amountMicros: 30_000n,
      txHash: "0xpull1",
    });
    expect(res.applied).toBe(true);
    expect(res.balanceMicros).toBe(0n);
    expect(await outstandingMicros(db, ACCOUNT)).toBe(0n);
  });

  it("is idempotent on the tx hash — a re-run cannot double-credit", async () => {
    await syncTabAccount(db, ACCOUNT, 50_000);
    await spend(30_000n, "r1");

    const first = await recordPull(db, {
      accountId: ACCOUNT,
      amountMicros: 30_000n,
      txHash: "0xsame",
    });
    const second = await recordPull(db, {
      accountId: ACCOUNT,
      amountMicros: 30_000n,
      txHash: "0xsame",
    });

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    expect(await getBalance(db, ACCOUNT)).toBe(0n); // moved once, not twice
  });

  it("lets the user keep spending after a partial pull", async () => {
    await syncTabAccount(db, ACCOUNT, 50_000);
    await spend(40_000n, "r1"); // owes 40_000, 10_000 headroom left

    await recordPull(db, { accountId: ACCOUNT, amountMicros: 40_000n, txHash: "0xp" });
    expect(await getBalance(db, ACCOUNT)).toBe(0n);

    // Full cap available again.
    await spend(45_000n, "r2");
    expect(await getBalance(db, ACCOUNT)).toBe(-45_000n);
  });

  it("rejects a non-positive pull", async () => {
    await syncTabAccount(db, ACCOUNT, 50_000);
    await expect(
      recordPull(db, { accountId: ACCOUNT, amountMicros: 0n, txHash: "0x" }),
    ).rejects.toThrow(RangeError);
  });
});
