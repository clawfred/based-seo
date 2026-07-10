import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Both the original app schema and the billing domain. Listing only the
  // former silently generates migrations without the ledger tables.
  schema: ["./db/schema.ts", "./db/schema/billing.ts"],
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
