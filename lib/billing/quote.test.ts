import { describe, expect, it } from "vitest";

import { ENDPOINTS, getBySlug } from "@/lib/registry";
import { QuoteError, maxTasksFor, quoteFor } from "./quote";

const segsOf = (slug: string) => slug.split("/");

// A concrete SERP task_post with well-known required params (keyword + location
// + language), so the single-task case can supply a valid body.
const taskPost = getBySlug("serp/google/organic/task_post")!;

describe("task_post batch cap", () => {
  it("caps every task_post endpoint at one task", () => {
    for (const e of ENDPOINTS.filter((x) => x.mode === "task_post")) {
      expect(maxTasksFor(e), e.slug).toBe(1);
    }
  });

  /**
   * The blocker: a batched async post charges for N tasks but only the first is
   * ever retrievable. It must be rejected at the quote step, before any charge.
   */
  it("rejects a multi-task async post before payment", () => {
    const twoTasks = [
      { keyword: "a", location_code: 2840, language_code: "en" },
      { keyword: "b", location_code: 2840, language_code: "en" },
    ];
    expect(() => quoteFor(segsOf(taskPost.slug), twoTasks)).toThrow(QuoteError);
    expect(() => quoteFor(segsOf(taskPost.slug), twoTasks)).toThrow(/at most 1 task/);
  });

  it("rejects the batch on count before it checks required params", () => {
    // Two tasks missing required params: still rejected for COUNT, proving the
    // cap fires regardless of what the tasks contain.
    try {
      quoteFor(segsOf(taskPost.slug), [{}, {}]);
      throw new Error("expected a throw");
    } catch (err) {
      expect(err).toBeInstanceOf(QuoteError);
      expect((err as QuoteError).message).toMatch(/at most 1 task/);
    }
  });

  it("accepts a single async task", () => {
    const q = quoteFor(segsOf(taskPost.slug), [
      { keyword: "a", location_code: 2840, language_code: "en" },
    ]);
    expect(q.tasks).toHaveLength(1);
    expect(q.isTaskPost).toBe(true);
  });

  it("still allows batches on non-task_post queued utilities", () => {
    // A `post` (non-task_post) endpoint that legitimately batches is unaffected.
    const batchable = ENDPOINTS.find((e) => e.mode === "post" && e.exposure === "public");
    if (batchable) expect(maxTasksFor(batchable)).toBeGreaterThan(1);
  });
});
