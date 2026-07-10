CREATE TABLE "payment_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"payer_address" text NOT NULL,
	"transaction_hash" text NOT NULL,
	"network" text NOT NULL,
	"endpoint" text NOT NULL,
	"amount" text NOT NULL,
	"asset" text NOT NULL,
	"status" text DEFAULT 'success' NOT NULL,
	"settled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "account_balances" (
	"account_id" text PRIMARY KEY NOT NULL,
	"balance_micros" bigint DEFAULT 0 NOT NULL,
	"floor_micros" bigint DEFAULT 0 NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"user_id" text,
	"payer_address" text,
	"entry_type" text NOT NULL,
	"amount_micros" bigint NOT NULL,
	"request_id" text,
	"related_entry_id" text,
	"status" text,
	"endpoint" text,
	"onchain_tx_hash" text,
	"block_number" bigint,
	"log_index" bigint,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"dfs_task_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"charge_ref" text,
	"status" text DEFAULT 'posted' NOT NULL,
	"result_key" text,
	"capability_token_hash" text,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_cache_grants" (
	"account_id" text NOT NULL,
	"cache_key" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_hold_idempotency" ON "ledger_entries" USING btree ("account_id","request_id") WHERE "ledger_entries"."entry_type" = 'debit_hold' AND "ledger_entries"."request_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_onchain_unique" ON "ledger_entries" USING btree ("onchain_tx_hash","log_index") WHERE "ledger_entries"."onchain_tx_hash" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "ledger_open_holds" ON "ledger_entries" USING btree ("status","expires_at") WHERE "ledger_entries"."status" = 'held';--> statement-breakpoint
CREATE INDEX "ledger_account_created" ON "ledger_entries" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_dfs_id" ON "tasks" USING btree ("dfs_task_id");--> statement-breakpoint
CREATE INDEX "tasks_account" ON "tasks" USING btree ("account_id","posted_at");--> statement-breakpoint
CREATE INDEX "tasks_reaper" ON "tasks" USING btree ("status","deadline_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cache_grant_pk" ON "user_cache_grants" USING btree ("account_id","cache_key");