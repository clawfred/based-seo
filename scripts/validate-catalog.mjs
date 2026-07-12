// Validate every catalogued DataForSEO path against the FREE sandbox.
// A real path returns HTTP 200 (with an internal task error for our dummy body).
// A hallucinated path returns HTTP 404.
// Sandbox never charges the account.

import { readFileSync, writeFileSync } from "node:fs";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = process.env.ENV_FILE ?? join(HERE, "..", ".env.development.local");
const CATALOG = join(HERE, "dataforseo-catalog.json");
const OUT = join(HERE, "catalog-validation.json");

// --- load creds without ever printing them ---
const env = Object.fromEntries(
  readFileSync(ENV_PATH, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    }),
);
const user = env.DATAFORSEO_USERNAME;
const pass = env.DATAFORSEO_PASSWORD;
if (!user || !pass) {
  console.error("missing DataForSEO creds");
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const endpoints = catalog.groups.flatMap((g) => g.endpoints.map((e) => ({ ...e, group: g.name })));

console.error(`validating ${endpoints.length} paths against sandbox...`);

const SANDBOX = "https://sandbox.dataforseo.com";
const CONCURRENCY = 8;

async function probe(ep) {
  const url = SANDBOX + ep.path;
  const method = (ep.method || "POST").toUpperCase();
  const init = {
    method,
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
  };
  // DataForSEO POST endpoints take an array of task objects. Empty object is
  // enough to prove the route exists (it'll return an internal validation error).
  if (method === "POST") init.body = JSON.stringify([{}]);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, init);
      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {}

      // 40202 = rate limited -> back off and retry
      if (json?.status_code === 40202 || res.status === 429) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }

      return {
        path: ep.path,
        group: ep.group,
        method,
        mode: ep.mode,
        priceUsd: ep.priceUsd,
        httpStatus: res.status,
        dfsStatus: json?.status_code ?? null,
        dfsMessage: json?.status_message ?? null,
        taskStatus: json?.tasks?.[0]?.status_code ?? null,
        taskMessage: json?.tasks?.[0]?.status_message ?? null,
        exists: res.status !== 404,
      };
    } catch (err) {
      if (attempt === 2) {
        return {
          path: ep.path,
          group: ep.group,
          method,
          httpStatus: null,
          error: String(err?.message || err),
          exists: null,
        };
      }
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

const results = [];
let idx = 0;
let done = 0;
async function worker() {
  while (idx < endpoints.length) {
    const my = idx++;
    const r = await probe(endpoints[my]);
    results.push(r);
    done++;
    if (done % 25 === 0) console.error(`  ${done}/${endpoints.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

results.sort((a, b) => a.path.localeCompare(b.path));
writeFileSync(OUT, JSON.stringify(results, null, 2));

const missing = results.filter((r) => r.exists === false);
const errored = results.filter((r) => r.exists === null);
const ok = results.filter((r) => r.exists === true);

console.log("\n════════ VALIDATION SUMMARY ════════");
console.log(`exists (non-404): ${ok.length}`);
console.log(`404 / NOT REAL  : ${missing.length}`);
console.log(`network errored : ${errored.length}`);

if (missing.length) {
  console.log("\n──── paths that 404'd (hallucinated or moved) ────");
  const byGroup = {};
  for (const m of missing) (byGroup[m.group] ||= []).push(m.path);
  for (const [g, paths] of Object.entries(byGroup)) {
    console.log(`\n${g} (${paths.length}):`);
    for (const p of paths) console.log(`  ${p}`);
  }
}
if (errored.length) {
  console.log("\n──── network errors ────");
  for (const e of errored.slice(0, 20)) console.log(`  ${e.path}: ${e.error}`);
}

// Distribution of internal status codes among existing paths
const codes = {};
for (const r of ok) {
  const k = `${r.dfsStatus}/${r.taskStatus ?? "-"}`;
  codes[k] = (codes[k] || 0) + 1;
}
console.log("\n──── dfsStatus/taskStatus distribution (existing paths) ────");
for (const [k, v] of Object.entries(codes).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(4)}  ${k}`);
}
console.log(`\nwrote ${OUT}`);
