import { describe, expect, it } from "vitest";

import { ENDPOINTS } from "@/lib/registry";
import { retrievalEndpointFor } from "./task-fetch";

describe("retrievalEndpointFor", () => {
  it("maps a SERP task_post to its advanced task_get", () => {
    const r = retrievalEndpointFor("serp/google/organic/task_post");
    expect(r?.slug).toBe("serp/google/organic/task_get/advanced");
  });

  it("maps a bare task_get family (Business Data)", () => {
    const r = retrievalEndpointFor("business_data/google/reviews/task_post");
    expect(r?.slug).toMatch(/business_data\/google\/reviews\/task_get/);
  });

  it("returns undefined for a slug with no retrieval endpoint", () => {
    expect(retrievalEndpointFor("nonexistent/task_post")).toBeUndefined();
  });

  /**
   * `on_page/task_post` is the one task_post with no `task_get`: an OnPage crawl
   * is queried by id through `on_page/summary` / `on_page/pages` etc., a
   * different retrieval model. Every OTHER task_post must resolve, or its result
   * would be unreachable after payment.
   */
  const QUERY_BY_ID_MODELS = new Set(["on_page/task_post"]);

  it("resolves a retrieval endpoint for every standard task_post", () => {
    const posts = ENDPOINTS.filter(
      (e) => e.mode === "task_post" && !QUERY_BY_ID_MODELS.has(e.slug),
    );
    expect(posts.length).toBeGreaterThan(60);

    const orphans = posts.filter((e) => !retrievalEndpointFor(e.slug));
    expect(orphans.map((e) => e.slug)).toEqual([]);
  });

  it("always resolves to an internal-only task_get (never a public passthrough)", () => {
    for (const post of ENDPOINTS.filter(
      (e) => e.mode === "task_post" && !QUERY_BY_ID_MODELS.has(e.slug),
    )) {
      const retrieval = retrievalEndpointFor(post.slug);
      expect(retrieval?.exposure, `${post.slug}`).toBe("internal");
    }
  });
});
