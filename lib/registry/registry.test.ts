import { describe, expect, it } from "vitest";

import {
  ENDPOINTS,
  alternatives,
  describeRequired,
  getBySlug,
  listPublic,
  missingRequired,
  resolvePath,
  resolvePublicPath,
} from "./index";
import { formatMicros, quote, quoteBatch, usdToMicros } from "./pricing";

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

  it("keeps ad_url public and billable — its id is a Google ad id, not a task id", () => {
    const adUrl = getBySlug("merchant/google/sellers/ad_url")!;
    expect(adUrl.exposure).toBe("public");
    expect(adUrl.billable).toBe(true);
    expect(adUrl.requiresTaskOwnership).toBe(false);
    expect(adUrl.pathParams).toEqual(["id"]);
  });
});

/**
 * These guard a cross-tenant data leak. All 531 endpoints run against one
 * DataForSEO account, so a public `task_get` lets any caller read any
 * customer's paid results, and `tasks_ready` hands them the id list. If the
 * registry is ever regenerated without the exposure rule, these fail.
 */
describe("IDOR guard: task retrieval is never publicly reachable", () => {
  it("marks every task_get and tasks_ready endpoint internal", () => {
    const leaked = ENDPOINTS.filter(
      (e) => /\/task_get(\/|$)|\/tasks_ready$/.test(e.dfsPath) && e.exposure !== "internal",
    );
    expect(leaked.map((e) => e.slug)).toEqual([]);
  });

  it("exposes no internal endpoint through the public resolver", () => {
    for (const e of ENDPOINTS.filter((x) => x.exposure === "internal")) {
      const segments = [...e.slug.split("/"), ...e.pathParams.map(() => "someid")];
      expect(resolvePublicPath(segments), `${e.slug} is publicly reachable`).toBeUndefined();
      // ...but server-side code can still reach it.
      expect(resolvePath(segments)).toBeDefined();
    }
  });

  it("still resolves every public endpoint publicly", () => {
    for (const e of listPublic()) {
      const segments = [...e.slug.split("/"), ...e.pathParams.map(() => "someid")];
      expect(resolvePublicPath(segments), `${e.slug} unreachable`).toBeDefined();
    }
  });

  it("leaves no billable endpoint hidden behind the internal flag", () => {
    const stranded = ENDPOINTS.filter((e) => e.billable && e.exposure === "internal");
    expect(stranded.map((e) => e.slug)).toEqual([]);
  });

  /**
   * OnPage result endpoints take a crawl id on our shared account, so a public
   * passthrough would let any caller read another user's site audit. They must
   * stay internal, reached only through the tenant-scoped audits route.
   */
  it("keeps every OnPage crawl-scoped result endpoint internal", () => {
    const crawlScoped = [
      "on_page/summary",
      "on_page/pages",
      "on_page/links",
      "on_page/resources",
      "on_page/duplicate_tags",
      "on_page/duplicate_content",
      "on_page/non_indexable",
      "on_page/redirect_chains",
    ];
    for (const slug of crawlScoped) {
      expect(getBySlug(slug)?.exposure, slug).toBe("internal");
    }
  });

  it("keeps on_page/task_post public and billable — it takes a target, not a crawl id", () => {
    const post = getBySlug("on_page/task_post")!;
    expect(post.exposure).toBe("public");
    expect(post.billable).toBe(true);
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

  /**
   * DataForSEO spells an either/or requirement as "location_name|location_code".
   * Treating that as a literal body key makes it unsatisfiable, which would 400
   * all 60 endpoints that use one — no matter what the caller sends.
   */
  describe("alternation requirements", () => {
    const ideas = getBySlug("dataforseo_labs/google/keyword_ideas/live")!;

    it("is satisfied by either alternative", () => {
      expect(ideas.required).toContain("location_name|location_code");
      expect(missingRequired(ideas, { keywords: ["a"], location_code: 2840 })).toEqual([]);
      expect(missingRequired(ideas, { keywords: ["a"], location_name: "United States" })).toEqual(
        [],
      );
    });

    it("still reports the requirement when no alternative is present", () => {
      expect(missingRequired(ideas, { keywords: ["a"] })).toEqual(["location_name|location_code"]);
    });

    it("describes an alternation readably", () => {
      expect(describeRequired("location_name|location_code")).toBe(
        "one of location_name, location_code",
      );
      expect(describeRequired("target")).toBe("target");
    });

    it("leaves no endpoint permanently unsatisfiable", () => {
      for (const e of ENDPOINTS) {
        // Supplying every alternative of every requirement must satisfy it.
        const body: Record<string, unknown> = {};
        for (const spec of e.required) for (const name of alternatives(spec)) body[name] = "x";
        expect(missingRequired(e, body), `${e.slug} cannot be satisfied`).toEqual([]);
      }
    });
  });
});

/**
 * The catalog spells some trailing params literally (`.../task_get/advanced/{id}`)
 * and omits them elsewhere. A slug carrying a brace would never match a real
 * request path.
 */
describe("path normalization", () => {
  it("leaves no brace in any slug or dfsPath", () => {
    const braced = ENDPOINTS.filter((e) => e.slug.includes("{") || e.dfsPath.includes("{"));
    expect(braced.map((e) => e.slug)).toEqual([]);
  });

  it("records a path param for every endpoint whose upstream path took one", () => {
    const taskGets = ENDPOINTS.filter((e) => /\/task_get(\/|$)/.test(e.dfsPath));
    expect(taskGets.length).toBeGreaterThan(0);
    for (const e of taskGets) expect(e.pathParams, e.slug).toEqual(["id"]);
  });
});

describe("pricing", () => {
  it("never quotes below what DataForSEO charges us", () => {
    for (const e of ENDPOINTS.filter((x) => x.billable)) {
      expect(quote(e).micros, `${e.slug} priced under upstream cost`).toBeGreaterThanOrEqual(
        usdToMicros(e.dfsCostUsd),
      );
    }
  });

  it("quotes zero for non-billable endpoints", () => {
    for (const e of ENDPOINTS.filter((x) => !x.billable)) {
      expect(quote(e).micros).toBe(0);
    }
  });

  it("scales a batch quote by task count", () => {
    const e = getBySlug("backlinks/summary/live")!;
    expect(quoteBatch(e, 5).micros).toBeGreaterThan(quote(e).micros);
    expect(quoteBatch(e, 1).micros).toBe(quote(e).micros);
  });

  it("does not scale a batch quote for a free endpoint", () => {
    const free = ENDPOINTS.find((x) => !x.billable)!;
    expect(quoteBatch(free, 10).micros).toBe(0);
  });

  it("always quotes a positive amount for a billable endpoint", () => {
    for (const e of ENDPOINTS.filter((x) => x.billable)) {
      expect(quote(e).micros, `${e.slug} quoted zero`).toBeGreaterThan(0);
    }
  });

  /**
   * x402 prices a request by `parseFloat(formatted.replace(/^\$/, ""))` and
   * multiplies by 10^6 for USDC. Formatting a $0.0006 endpoint as "$0.00" would
   * settle zero atomic units and serve it free. Cent-rounding is a revenue bug.
   */
  describe("sub-cent precision", () => {
    const parseAsX402Would = (formatted: string) => parseFloat(formatted.replace(/^\$/, ""));

    it("never formats a billable endpoint down to zero", () => {
      for (const e of ENDPOINTS.filter((x) => x.billable)) {
        const q = quote(e);
        expect(parseAsX402Would(q.formatted), `${e.slug} formats to zero`).toBeGreaterThan(0);
      }
    });

    it("round-trips the formatted price back to the exact micro amount", () => {
      for (const e of ENDPOINTS.filter((x) => x.billable)) {
        const q = quote(e);
        const atomicUnits = Math.round(parseAsX402Would(q.formatted) * 1e6);
        expect(atomicUnits, `${e.slug} loses precision in formatting`).toBe(q.micros);
      }
    });

    it("renders sub-cent amounts with their significant digits", () => {
      expect(formatMicros(600)).toBe("$0.0006");
      expect(formatMicros(1)).toBe("$0.000001");
      expect(formatMicros(30_000)).toBe("$0.03");
      expect(formatMicros(0)).toBe("$0");
    });

    it("keeps every quote an integer number of micro-USD", () => {
      for (const e of ENDPOINTS) {
        expect(Number.isInteger(quote(e).micros), `${e.slug} has fractional micros`).toBe(true);
      }
    });
  });
});
