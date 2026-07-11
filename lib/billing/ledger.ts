/**
 * Ledger operations: hold, capture, release.
 *
 * Every operation here is ONE SQL statement. That is a hard constraint, not a
 * style choice: `db/index.ts` uses the neon-http driver, which throws
 * "No transactions support in neon-http driver". A read-then-write debit across
 * two statements would let two concurrent requests both observe a sufficient
 * balance and both spend it.
 *
 * Postgres guarantees statement-level atomicity, and a data-modifying CTE lets
 * a dependent INSERT ride along with its guarding UPDATE. The `UPDATE ... WHERE
 * balance - price >= floor` predicate is re-evaluated against the latest
 * committed row after each waiter takes the row lock, so under a 50-way agent
 * fan-out the overdrawing requests match zero rows and fall through to x402
 * rather than double-spending.
 */

import { sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

import { newId } from "@/lib/id";

/** Any drizzle pg database. Widened so tests can drive PGlite. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LedgerDb = NeonHttpDatabase<any> | { execute: (q: any) => Promise<any> };

export interface Hold {
  readonly holdId: string;
  readonly balanceAfterMicros: bigint;
}

export type HoldResult =
  | { readonly ok: true; readonly hold: Hold }
  /** Balance would drop below the floor, or the account is suspended. */
  | { readonly ok: false; readonly reason: "insufficient_funds" }
  /** This Idempotency-Key already produced a hold. Never charge twice. */
  | { readonly ok: false; readonly reason: "duplicate_request"; readonly holdId: string };

function rows<T>(result: unknown): T[] {
  // neon-http returns { rows }, PGlite's drizzle driver returns { rows } too;
  // a bare array shows up when a driver returns rows directly.
  if (Array.isArray(result)) return result as T[];
  const r = (result as { rows?: T[] })?.rows;
  return r ?? [];
}

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string; cause?: { code?: string } })?.code;
  return (
    code === UNIQUE_VIOLATION ||
    (err as { cause?: { code?: string } })?.cause?.code === UNIQUE_VIOLATION
  );
}

/**
 * Reserve `priceMicros` against an account.
 *
 * The balance is decremented immediately and a `held` ledger row is written.
 * Nothing external may run inside this call — the DataForSEO fetch happens
 * strictly after it returns, so the row lock is held for microseconds rather
 * than for the duration of an upstream request.
 */
export async function holdFunds(
  db: LedgerDb,
  params: {
    accountId: string;
    priceMicros: bigint;
    endpoint: string;
    requestId: string | null;
    expiresAt: Date;
    userId?: string | null;
    payerAddress?: string | null;
  },
): Promise<HoldResult> {
  const { accountId, priceMicros, endpoint, requestId, expiresAt } = params;

  if (priceMicros <= 0n) throw new RangeError("holdFunds requires a positive price");

  const holdId = newId();

  try {
    const result = await db.execute(sql`
      WITH guarded AS (
        UPDATE account_balances
           SET balance_micros = balance_micros - ${priceMicros}::bigint,
               updated_at = now()
         WHERE account_id = ${accountId}
           AND state = 'active'
           AND balance_micros - ${priceMicros}::bigint >= floor_micros
        RETURNING account_id, balance_micros
      )
      INSERT INTO ledger_entries (
        id, account_id, user_id, payer_address, entry_type, amount_micros,
        request_id, status, endpoint, expires_at
      )
      SELECT ${holdId}, guarded.account_id, ${params.userId ?? null}, ${params.payerAddress ?? null},
             'debit_hold', ${-priceMicros}::bigint,
             ${requestId}, 'held', ${endpoint}, ${expiresAt.toISOString()}::timestamptz
        FROM guarded
      RETURNING id, (SELECT balance_micros FROM guarded) AS balance_after
    `);

    const inserted = rows<{ id: string; balance_after: string | bigint }>(result);
    if (inserted.length === 0) return { ok: false, reason: "insufficient_funds" };

    return {
      ok: true,
      hold: { holdId, balanceAfterMicros: BigInt(inserted[0].balance_after) },
    };
  } catch (err) {
    if (isUniqueViolation(err) && requestId) {
      const existing = await findHoldByRequestId(db, accountId, requestId);
      // The unique index fired, so a prior hold exists by construction.
      return { ok: false, reason: "duplicate_request", holdId: existing ?? holdId };
    }
    throw err;
  }
}

export async function findHoldByRequestId(
  db: LedgerDb,
  accountId: string,
  requestId: string,
): Promise<string | null> {
  const result = await db.execute(sql`
    SELECT id FROM ledger_entries
     WHERE account_id = ${accountId}
       AND request_id = ${requestId}
       AND entry_type = 'debit_hold'
     LIMIT 1
  `);
  return rows<{ id: string }>(result)[0]?.id ?? null;
}

/**
 * Turn a hold into revenue. Guarded on `status = 'held'`, so capture and release
 * are mutually exclusive: if the sweeper already released this hold the caller
 * gets `false` and must NOT return the paid result — the user was refunded.
 */
export async function captureHold(db: LedgerDb, holdId: string): Promise<boolean> {
  const result = await db.execute(sql`
    WITH captured AS (
      UPDATE ledger_entries
         SET status = 'captured'
       WHERE id = ${holdId} AND status = 'held'
      RETURNING id, account_id, amount_micros
    )
    INSERT INTO ledger_entries (id, account_id, entry_type, amount_micros, related_entry_id, endpoint)
    SELECT ${newId()}, account_id, 'debit_capture', 0::bigint, id,
           (SELECT endpoint FROM ledger_entries WHERE id = ${holdId})
      FROM captured
    RETURNING id
  `);
  return rows(result).length > 0;
}

/**
 * Return a hold's funds. Guarded the same way, so a retried release cannot
 * double-refund and a sweeper racing a slow success has exactly one winner.
 */
export async function releaseHold(db: LedgerDb, holdId: string): Promise<boolean> {
  const result = await db.execute(sql`
    WITH released AS (
      UPDATE ledger_entries
         SET status = 'released'
       WHERE id = ${holdId} AND status = 'held'
      RETURNING id, account_id, amount_micros, endpoint
    ),
    compensating AS (
      INSERT INTO ledger_entries (id, account_id, entry_type, amount_micros, related_entry_id, endpoint)
      SELECT ${newId()}, account_id, 'debit_release', -amount_micros, id, endpoint
        FROM released
      RETURNING account_id, amount_micros
    )
    -- c.amount_micros is the INSERTED row's amount, already positive (it is the
    -- negation of the hold's negative amount). Add it back; subtracting here
    -- would debit the user a second time on refund.
    UPDATE account_balances b
       SET balance_micros = b.balance_micros + c.amount_micros,
           updated_at = now()
      FROM compensating c
     WHERE b.account_id = c.account_id
    RETURNING b.balance_micros
  `);
  return rows(result).length > 0;
}

/**
 * Release every hold whose deadline has passed. Vercel functions die mid-flight;
 * a crash between hold and capture would otherwise strand a user's funds.
 * Safe to run concurrently with a slow success — the status guard picks a winner.
 */
export async function sweepExpiredHolds(
  db: LedgerDb,
  now: Date = new Date(),
  accountId?: string,
): Promise<number> {
  // When scoped to an account, only that account's expired holds are swept —
  // this is the opportunistic path the balance rail runs so a user reclaims
  // their own stranded funds on their next request, independent of the cron.
  const scope = accountId ? sql`AND account_id = ${accountId}` : sql``;
  const result = await db.execute(sql`
    WITH expired AS (
      UPDATE ledger_entries
         SET status = 'released'
       WHERE status = 'held' AND expires_at < ${now.toISOString()}::timestamptz ${scope}
      RETURNING id, account_id, amount_micros, endpoint
    ),
    compensating AS (
      INSERT INTO ledger_entries (id, account_id, entry_type, amount_micros, related_entry_id, endpoint)
      SELECT gen_random_uuid()::text, account_id, 'debit_release', -amount_micros, id, endpoint
        FROM expired
      RETURNING account_id, amount_micros
    ),
    restored AS (
      -- Add, for the same reason as releaseHold: c.amount_micros is the
      -- compensating credit, not the original debit.
      UPDATE account_balances b
         SET balance_micros = b.balance_micros + c.amount_micros,
             updated_at = now()
        FROM compensating c
       WHERE b.account_id = c.account_id
      RETURNING b.account_id
    )
    SELECT count(*)::int AS n FROM expired
  `);
  return rows<{ n: number }>(result)[0]?.n ?? 0;
}

export async function getBalance(db: LedgerDb, accountId: string): Promise<bigint | null> {
  const result = await db.execute(sql`
    SELECT balance_micros FROM account_balances WHERE account_id = ${accountId}
  `);
  const row = rows<{ balance_micros: string | bigint }>(result)[0];
  return row ? BigInt(row.balance_micros) : null;
}

/**
 * Assert the materialized balance still equals the ledger. Drift means a bug
 * moved money without writing it down; the caller should freeze the account.
 *
 * The sum is over EVERY entry, unfiltered. A hold's debit and, if it was
 * released, its compensating credit already net to zero; a captured hold keeps
 * its debit and its `debit_capture` row carries no amount. Excluding entry
 * types here would double-count them.
 */
export async function reconcile(
  db: LedgerDb,
  accountId: string,
): Promise<{ balanceMicros: bigint; ledgerSumMicros: bigint; drift: bigint }> {
  const result = await db.execute(sql`
    SELECT
      (SELECT balance_micros FROM account_balances WHERE account_id = ${accountId}) AS balance,
      COALESCE((
        SELECT sum(amount_micros) FROM ledger_entries WHERE account_id = ${accountId}
      ), 0) AS ledger_sum
  `);
  const row = rows<{ balance: string | null; ledger_sum: string }>(result)[0];
  const balanceMicros = BigInt(row?.balance ?? 0);
  const ledgerSumMicros = BigInt(row?.ledger_sum ?? 0);
  return { balanceMicros, ledgerSumMicros, drift: balanceMicros - ledgerSumMicros };
}
