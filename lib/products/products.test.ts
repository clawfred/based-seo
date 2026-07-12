import { describe, expect, it } from "vitest";

import { QuoteError } from "@/lib/billing/quote";
import { quote } from "@/lib/registry/pricing";
import { PRODUCTS, componentsOf, getProduct, priceMicros } from "./index";
import { quoteProduct } from "./quote";

describe("product definitions", () => {
  it("resolves every component against the registry", () => {
    for (const product of PRODUCTS) {
      expect(() => componentsOf(product), `${product.id}`).not.toThrow();
    }
  });

  it("fans out only to public, billable endpoints", () => {
    for (const product of PRODUCTS) {
      for (const endpoint of componentsOf(product)) {
        expect(endpoint.exposure, `${product.id} -> ${endpoint.slug}`).toBe("public");
      }
    }
  });

  it("prices a product as the exact sum of its components", () => {
    for (const product of PRODUCTS) {
      const expected = componentsOf(product).reduce((sum, e) => sum + quote(e).micros, 0);
      expect(priceMicros(product), product.id).toBe(expected);
    }
  });

  it("never sells a bundle below the cost of its parts", () => {
    for (const product of PRODUCTS) {
      const upstream = componentsOf(product).reduce(
        (sum, e) => sum + quote(e).upstreamCostMicros,
        0,
      );
      expect(priceMicros(product), product.id).toBeGreaterThanOrEqual(upstream);
    }
  });
});

describe("quoteProduct", () => {
  it("rejects an unknown product before any charge", () => {
    expect(() => quoteProduct("nope", { keyword: "x" })).toThrow(QuoteError);
  });

  it("requires a keyword", () => {
    expect(() => quoteProduct("keyword-overview", {})).toThrow(/keyword/);
    expect(() => quoteProduct("keyword-overview", { keyword: "   " })).toThrow(/keyword/);
  });

  it("accepts a single keyword as a batch of one", () => {
    const q = quoteProduct("keyword-overview", { keyword: " seo tools " });
    expect(q.keywords).toEqual(["seo tools"]);
    expect(q.micros).toBe(priceMicros(q.product, 1));
  });

  /**
   * The old batch endpoint priced from a client-supplied `x-keyword-count`
   * header. Price must instead scale with the array we forward upstream.
   */
  it("prices a batch from the keywords it will forward, not a header", () => {
    const one = quoteProduct("keyword-overview", { keyword: "a" });
    const five = quoteProduct("keyword-overview", { keywords: ["a", "b", "c", "d", "e"] });
    expect(five.micros).toBe(one.micros * 5);
    expect(five.body).toEqual({
      keywords: ["a", "b", "c", "d", "e"],
      location_code: 2840,
      language_code: "en",
    });
  });

  it("caps batch size", () => {
    const many = Array.from({ length: 26 }, (_, i) => `k${i}`);
    expect(() => quoteProduct("keyword-overview", { keywords: many })).toThrow(/At most 25/);
  });

  it("rejects an empty or malformed keywords array", () => {
    expect(() => quoteProduct("keyword-overview", { keywords: [] })).toThrow(QuoteError);
    expect(() => quoteProduct("keyword-overview", { keywords: [""] })).toThrow(QuoteError);
    expect(() => quoteProduct("keyword-overview", { keywords: [42] })).toThrow(QuoteError);
  });

  it("rejects an overlong keyword", () => {
    expect(() => quoteProduct("keyword-overview", { keyword: "x".repeat(701) })).toThrow(
      QuoteError,
    );
  });

  it("defaults location and language", () => {
    const q = quoteProduct("serp-analysis", { keyword: "x" });
    expect(q.locationCode).toBe(2840);
    expect(q.languageCode).toBe("en");
  });

  it("marks every product billable and never a task post", () => {
    for (const p of PRODUCTS) {
      const q = quoteProduct(p.slug, { keyword: "x" });
      expect(q.billable, p.slug).toBe(true);
      expect(q.isTaskPost).toBe(false);
      expect(q.micros).toBeGreaterThan(0);
    }
  });

  it("formats a price x402 can parse without precision loss", () => {
    for (const p of PRODUCTS) {
      const q = quoteProduct(p.slug, { keyword: "x" });
      const atomic = Math.round(parseFloat(q.formatted.replace(/^\$/, "")) * 1e6);
      expect(atomic, p.slug).toBe(q.micros);
    }
  });
});

describe("getProduct", () => {
  it("finds each product by slug", () => {
    for (const p of PRODUCTS) expect(getProduct(p.slug)?.id).toBe(p.id);
  });
  it("returns undefined for an unknown slug", () => {
    expect(getProduct("nope")).toBeUndefined();
  });
});
