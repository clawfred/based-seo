/**
 * The allowance tab, expressed on the ledger.
 *
 * A tab account never holds a positive prepaid balance. Instead its `floor` is
 * set to the negative of what the user can spend (`min(allowance, balance)`),
 * and `balance` starts at 0. As the user spends, the balance goes negative — a
 * receivable — down to the floor. A `transferFrom` pull collects the receivable
 * and moves the balance back toward 0.
 *
 * This reuses the existing hold/capture path unchanged: `holdFunds` already
 * permits spending down to `floor`, so a tab account "just works" on the
 * balance rail once its floor is seeded.
 */

import { sql } from "drizzle-orm";

import { newId } from "@/lib/id";
import type { LedgerDb } from "./ledger";

function rows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return (result as { rows?: T[] })?.rows ?? [];
}

/**
 * Create or update a tab account so the user can spend up to `spendableMicros`.
 *
 * Lowering the cap (allowance revoked, or wallet drained) is honored, but never
 * below what the user has already spent: the floor cannot rise above the current
 * negative balance, or an in-flight receivable would become unpayable on paper.
 */
export async function syncTabAccount(
  db: LedgerDb,
  accountId: string,
  spendableMicros: number,
): Promise<{ balanceMicros: bigint; floorMicros: bigint }> {
  const floor = BigInt(-Math.max(0, Math.floor(spendableMicros)));

  const result = await db.execute(sql`
    INSERT INTO account_balances (account_id, balance_micros, floor_micros, state)
    VALUES (${accountId}, 0, ${floor}, 'active')
    ON CONFLICT (account_id) DO UPDATE
      SET floor_micros = LEAST(${floor}, account_balances.balance_micros),
          updated_at = now()
    RETURNING balance_micros, floor_micros
  `);

  const row = rows<{ balance_micros: string; floor_micros: string }>(result)[0];
  return { balanceMicros: BigInt(row.balance_micros), floorMicros: BigInt(row.floor_micros) };
}

/**
 * How much a tab account still owes us — the receivable to collect via
 * `transferFrom`. Zero for a settled or unused tab.
 */
export async function outstandingMicros(db: LedgerDb, accountId: string): Promise<bigint> {
  const result = await db.execute(sql`
    SELECT balance_micros FROM account_balances WHERE account_id = ${accountId}
  `);
  const row = rows<{ balance_micros: string }>(result)[0];
  if (!row) return 0n;
  const balance = BigInt(row.balance_micros);
  return balance < 0n ? -balance : 0n;
}

/**
 * Record an on-chain pull that collected `amountMicros` from the user's wallet.
 *
 * Raises the balance back toward zero and writes an immutable `pull_settlement`
 * row carrying the tx hash. Idempotent on `(onchain_tx_hash, log_index)` via the
 * ledger's unique index, so a re-run of the settlement job cannot double-credit.
 */
export async function recordPull(
  db: LedgerDb,
  params: { accountId: string; amountMicros: bigint; txHash: string; logIndex?: number },
): Promise<{ applied: boolean; balanceMicros: bigint }> {
  if (params.amountMicros <= 0n) {
    throw new RangeError("recordPull requires a positive amount");
  }

  const result = await db.execute(sql`
    WITH ins AS (
      INSERT INTO ledger_entries (id, account_id, entry_type, amount_micros, onchain_tx_hash, log_index)
      VALUES (${newId()}, ${params.accountId}, 'pull_settlement', ${params.amountMicros},
              ${params.txHash}, ${params.logIndex ?? 0})
      -- Must repeat the partial index's predicate so Postgres can pick it as the
      -- conflict arbiter; ON CONFLICT (cols) alone cannot match a partial index.
      ON CONFLICT (onchain_tx_hash, log_index) WHERE onchain_tx_hash IS NOT NULL DO NOTHING
      RETURNING account_id, amount_micros
    )
    UPDATE account_balances b
       SET balance_micros = b.balance_micros + ins.amount_micros,
           updated_at = now()
      FROM ins
     WHERE b.account_id = ins.account_id
    RETURNING b.balance_micros
  `);

  const row = rows<{ balance_micros: string }>(result)[0];
  if (!row) {
    // Conflict: this pull was already recorded. Report the current balance.
    const current = await db.execute(sql`
      SELECT balance_micros FROM account_balances WHERE account_id = ${params.accountId}
    `);
    const b = rows<{ balance_micros: string }>(current)[0];
    return { applied: false, balanceMicros: BigInt(b?.balance_micros ?? 0) };
  }
  return { applied: true, balanceMicros: BigInt(row.balance_micros) };
}
