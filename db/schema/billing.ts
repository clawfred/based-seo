import { bigint, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Billing ledger.
 *
 * Money is always an integer count of micro-USD (10^-6 USD), stored as bigint.
 * Never `real` (floats lose cents), never `text` (arithmetic on strings). USDC
 * has exactly 6 decimals, so micro-USD is lossless against on-chain amounts.
 *
 * `ledger_entries` is append-only and is the source of truth. `account_balances`
 * is a materialization of it, kept correct by the guarded debit in
 * `lib/billing/ledger.ts` and audited by a reconciliation job. The pair exists
 * because a balance column alone can never answer "why is my balance $3.17?",
 * and a SUM over the ledger on every request does not survive a 50-way agent
 * fan-out.
 */

export const ENTRY_TYPES = [
  "deposit",
  "deposit_reversal",
  "debit_hold",
  "debit_capture",
  "debit_release",
  "pull_settlement",
  "credit_adjustment",
  "refund",
] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

/** Only holds have lifecycle. Every other entry type is an immutable fact. */
export const HOLD_STATUSES = ["held", "captured", "released"] as const;
export type HoldStatus = (typeof HOLD_STATUSES)[number];

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: text("id").primaryKey(),

    /**
     * Accounts are keyed by Privy user id when there is a session, and by
     * lowercased payer wallet address otherwise. Agents pay by wallet with no
     * account, and still need somewhere to accrue refund credits.
     */
    accountId: text("account_id").notNull(),
    userId: text("user_id"),
    payerAddress: text("payer_address"),

    entryType: text("entry_type").$type<EntryType>().notNull(),

    /** Signed micro-USD. Debits negative, credits positive. */
    amountMicros: bigint("amount_micros", { mode: "bigint" }).notNull(),

    /** Client-supplied Idempotency-Key. Enforced unique per account for holds. */
    requestId: text("request_id"),

    /** Capture/release rows point back at the hold they resolve. */
    relatedEntryId: text("related_entry_id"),

    /** Set on holds only. */
    status: text("status").$type<HoldStatus>(),

    endpoint: text("endpoint"),

    /** On-chain provenance for deposits and pulls. */
    onchainTxHash: text("onchain_tx_hash"),
    blockNumber: bigint("block_number", { mode: "bigint" }),
    logIndex: bigint("log_index", { mode: "bigint" }),

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Holds older than their deadline are swept and released. */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [
    /**
     * Idempotency enforcement point. One key per account yields one hold, so a
     * client retry without a new key cannot be charged twice.
     */
    uniqueIndex("ledger_hold_idempotency")
      .on(t.accountId, t.requestId)
      .where(sql`${t.entryType} = 'debit_hold' AND ${t.requestId} IS NOT NULL`),

    /** A deposit can never be credited twice, even if the watcher re-scans. */
    uniqueIndex("ledger_onchain_unique")
      .on(t.onchainTxHash, t.logIndex)
      .where(sql`${t.onchainTxHash} IS NOT NULL`),

    /** The sweeper's query: unresolved holds past their deadline. */
    index("ledger_open_holds")
      .on(t.status, t.expiresAt)
      .where(sql`${t.status} = 'held'`),

    index("ledger_account_created").on(t.accountId, t.createdAt),
  ],
);

export const ACCOUNT_STATES = ["active", "suspended"] as const;
export type AccountState = (typeof ACCOUNT_STATES)[number];

export const accountBalances = pgTable("account_balances", {
  accountId: text("account_id").primaryKey(),

  balanceMicros: bigint("balance_micros", { mode: "bigint" }).notNull().default(0n),

  /**
   * Lowest the balance may reach. Zero for prepaid credits. Negative for an
   * allowance tab, where the figure is a receivable we later pull on-chain and
   * its magnitude caps our exposure to a user who revokes their allowance.
   */
  floorMicros: bigint("floor_micros", { mode: "bigint" }).notNull().default(0n),

  /** Suspended accounts cannot hold; a reorged deposit that was already spent lands here. */
  state: text("state").$type<AccountState>().notNull().default("active"),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Records that an account has already paid for a given cache key.
 *
 * Pricing must depend only on the requester's own payment history, never on
 * shared cache state. A quote that varied with the shared cache would be a
 * cross-tenant oracle: because the 402 challenge is issued before payment, an
 * attacker could enumerate keywords for free and learn, from the price alone,
 * which ones another customer had researched in the last 24h.
 */
export const userCacheGrants = pgTable(
  "user_cache_grants",
  {
    accountId: text("account_id").notNull(),
    cacheKey: text("cache_key").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("cache_grant_pk").on(t.accountId, t.cacheKey)],
);

export const TASK_STATUSES = [
  "posted",
  "ready",
  "delivered",
  "failed",
  "expired",
  "refunded",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * Async DataForSEO tasks, scoped to a tenant.
 *
 * `dfsTaskId` is a secret and must never be serialized to a client: DataForSEO's
 * task_get returns results for any valid id on our single account. Customers see
 * only `id`, and prove ownership with a session or a capability token.
 */
export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    dfsTaskId: text("dfs_task_id").notNull(),
    endpoint: text("endpoint").notNull(),

    /** The hold id (balance rail) or settlement tx hash (x402 rail). */
    chargeRef: text("charge_ref"),
    status: text("status").$type<TaskStatus>().notNull().default("posted"),

    /** Pointer into api_cache once the result has been fetched. */
    resultKey: text("result_key"),
    /** HMAC of the capability token, so a DB leak does not grant task access. */
    capabilityTokenHash: text("capability_token_hash"),

    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("tasks_dfs_id").on(t.dfsTaskId),
    index("tasks_account").on(t.accountId, t.postedAt),
    index("tasks_reaper").on(t.status, t.deadlineAt),
  ],
);
