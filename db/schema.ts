import { pgTable, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/*  Users                                                              */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: text("id").primaryKey(), // auth provider ID (Privy DID)
  email: text("email"),
  walletAddress: text("wallet_address"),
  preferences: jsonb("preferences").$type<UserPreferences>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export interface UserPreferences {
  defaultLocation?: string;
  theme?: "light" | "dark" | "system";
}

/* ------------------------------------------------------------------ */
/*  Keyword Folders                                                    */
/* ------------------------------------------------------------------ */

export const folders = pgTable("folders", {
  id: text("id").primaryKey(), // nanoid
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Saved Keywords                                                     */
/* ------------------------------------------------------------------ */

export const savedKeywords = pgTable("saved_keywords", {
  id: text("id").primaryKey(), // nanoid
  folderId: text("folder_id")
    .notNull()
    .references(() => folders.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  locationCode: integer("location_code"),
  volume: integer("volume").notNull().default(0),
  kd: integer("kd").notNull().default(0),
  cpc: real("cpc").notNull().default(0),
  competition: real("competition").notNull().default(0),
  intent: text("intent").notNull().default("Informational"),
  trend: jsonb("trend").$type<number[]>().default([]),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Search History                                                     */
/* ------------------------------------------------------------------ */

export const searchHistory = pgTable("search_history", {
  id: text("id").primaryKey(), // nanoid
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  tool: text("tool").notNull().default("overview"), // overview | finder
  locationCode: integer("location_code"),
  searchedAt: timestamp("searched_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  DataForSEO Cache                                                   */
/* ------------------------------------------------------------------ */

export const apiCache = pgTable("api_cache", {
  cacheKey: text("cache_key").primaryKey(), // hash of endpoint + params
  data: jsonb("data").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/* ------------------------------------------------------------------ */
/*  Payment Transactions (x402)                                        */
/* ------------------------------------------------------------------ */

export const paymentTransactions = pgTable("payment_transactions", {
  id: text("id").primaryKey(), // nanoid
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  payerAddress: text("payer_address").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  network: text("network").notNull(),
  endpoint: text("endpoint").notNull(),
  amount: text("amount").notNull(),
  asset: text("asset").notNull(),
  status: text("status").notNull().default("success"),
  settledAt: timestamp("settled_at", { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
});
