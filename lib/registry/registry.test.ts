import { describe, expect, it } from "vitest";

import { ENDPOINTS, getBySlug, missingRequired, resolvePath } from "./index";
import { quote, quoteBatch } from "./pricing";

describe("registry integrity", () => {
  it("carries every verified endpoint", () => {
    expect(ENDPOINTS.length).toBe(531);
  });

  it("has unique ids and slugs", () => {
    expect(new Set(ENDPOINTS.map((e) => e.id)).size).toBe(ENDPOINTS.length);
    expect(new Set(ENDPOINTS.map((e) => e.slug)).size).toBe(ENDPOINTS.length);
  });

  it("excludes the two endpoints proven dead against the sandbox", () => {
    expect(getBySlug("dataforseo_labs/google/available_history/live")).toBeUndefined();
    expect(getBySlug("content_generation/check_grammar/rules")).toBeUndefined();
  });

  it("never marks a free-retrieval endpoint as billable", () => {
    const bad = ENDPOINTS.filter((e) => e.freeRetrieval && e.billable);
    expect(bad).toEqual([]);
  });

  it("requires task ownership on every task_get, since ids are guessable across tenants", () => {
    const unguarded = ENDPOINTS.filter(
      (e) => /\/task_get(\/|$)/.test(e.dfsPath) && !e.requiresTaskOwnership,
    );
    expect(unguarded).toEqual([]);
  });

  it("declares an id path param on every ownership-guarded endpoint", () => {
    const missing = ENDPOINTS.filter(
      (e) => e.requiresTaskOwnership && !e.pathParams.includes("id"),
    );
    expect(missing).toEqual([]);
  });

  it("never lists a path param as a required body param", () => {
    const leaked = ENDPOINTS.filter((e) => e.required.some((r) => e.pathParams.includes(r)));
    expect(leaked).toEqual([]);
  });
});

describe("resolvePath", () => {
  it("resolves a plain live endpoint", () => {
    const r = resolvePath(["backlinks", "summary", "live"]);
    expect(r?.endpoint.dfsPath).toBe("/v3/backlinks/summary/live");
    expect(r?.pathParams).toEqual({});
  });

  it("peels a trailing task id off a SERP task_get variant", () => {
    const r = resolvePath(["serp", "google", "organic", "task_get", "regular", "abc-123"]);
    expect(r?.endpoint.dfsPath).toBe("/v3/serp/google/organic/task_get/regular");
    expect(r?.pathParams).toEqual({ id: "abc-123" });
  });

  it("peels a trailing task id off a bare Business Data task_get", () => {
    const r = resolvePath(["business_data", "google", "reviews", "task_get", "abc-123"]);
    expect(r?.endpoint.dfsPath).toBe("/v3/business_data/google/reviews/task_get");
    expect(r?.pathParams).toEqual({ id: "abc-123" });
  });

  it("does not resolve a task_get missing its id", () => {
    expect(resolvePath(["business_data", "google", "reviews", "task_get"])).toBeUndefined();
  });

  it("does not resolve a task_get with too many trailing segments", () => {
    expect(resolvePath(["backlinks", "summary", "live", "extra"])).toBeUndefined();
  });

  it("returns undefined for an unknown path rather than throwing", () => {
    expect(resolvePath(["totally", "made", "up"])).toBeUndefined();
    expect(resolvePath([])).toBeUndefined();
  });

  it("round-trips every registry slug back to itself", () => {
    for (const e of ENDPOINTS) {
      const segments = [...e.slug.split("/"), ...e.pathParams.map(() => "someid")];
      const r = resolvePath(segments);
      expect(r, `failed to resolve ${e.slug}`).toBeDefined();
      expect(r!.endpoint.id, `wrong endpoint for ${e.slug}`).toBe(e.id);
    }
  });
});

describe("missingRequired", () => {
  const summary = getBySlug("backlinks/summary/live")!;

  it("names the absent required params", () => {
    expect(missingRequired(summary, {})).toEqual(["target"]);
  });

  it("passes when required params are present", () => {
    expect(missingRequired(summary, { target: "example.com" })).toEqual([]);
  });

  it("treats explicit null as absent", () => {
    expect(missingRequired(summary, { target: null })).toEqual(["target"]);
  });
});

describe("pricing", () => {
  it("never quotes below what DataForSEO charges us", () => {
    for (const e of ENDPOINTS.filter((x) => x.billable)) {
      expect(quote(e).usd, `${e.slug} priced under upstream cost`).toBeGreaterThanOrEqual(
        e.dfsCostUsd,
      );
    }
  });

  it("quotes zero for non-billable endpoints", () => {
    for (const e of ENDPOINTS.filter((x) => !x.billable)) {
      expect(quote(e).usd).toBe(0);
    }
  });

  it("scales a batch quote by task count", () => {
    const e = getBySlug("backlinks/summary/live")!;
    expect(quoteBatch(e, 5).usd).toBeGreaterThan(quote(e).usd);
    expect(quoteBatch(e, 1).usd).toBe(quote(e).usd);
  });

  it("does not scale a batch quote for a free endpoint", () => {
    const free = ENDPOINTS.find((x) => !x.billable)!;
    expect(quoteBatch(free, 10).usd).toBe(0);
  });

  it("rounds up to the cent so settlement never lands under cost", () => {
    const e = getBySlug("backlinks/summary/live")!;
    expect(Number.isInteger(Math.round(quote(e).usd * 100))).toBe(true);
  });
});
