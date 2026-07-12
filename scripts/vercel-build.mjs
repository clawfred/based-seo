/**
 * Build entry point for Vercel.
 *
 * Syncs the database schema, then builds. The sync runs ONLY on a production
 * deploy (VERCEL_ENV === "production") so a preview build never touches the
 * production database — previews share this repo's code but must not mutate prod
 * schema. Locally (VERCEL_ENV unset) the sync is skipped and only the build runs.
 *
 * Uses `drizzle-kit push` rather than `migrate` because this database was created
 * by push and has no migration history to baseline against; push introspects the
 * live schema and applies only the diff, so it is idempotent (no drift = no-op)
 * and non-destructive for additive changes. A failure fails the build on purpose
 * — deploying code that expects tables which don't exist is worse than a failed
 * deploy.
 */

import { execSync } from "node:child_process";

const isProd = process.env.VERCEL_ENV === "production";
const hasDb = Boolean(process.env.DATABASE_URL);

if (isProd && hasDb) {
  console.log("[build] production deploy: syncing database schema…");
  execSync("npx drizzle-kit push --force", { stdio: "inherit" });
} else if (isProd && !hasDb) {
  // Fail loudly: a prod deploy with no DATABASE_URL would boot into a broken
  // billing/tasks layer that 503s every balance request.
  console.error("[build] VERCEL_ENV=production but DATABASE_URL is unset — refusing to build.");
  process.exit(1);
} else {
  console.log("[build] skipping migrations (not a production deploy).");
}

execSync("next build", { stdio: "inherit" });
