import { describe, expect, it } from "vitest";

import { ENDPOINTS, getBySlug, listPublic } from "@/lib/registry";
import { buildLlmsTxt } from "./llms-txt";
import { buildManifest } from "./manifest";
import { buildOpenApi } from "./openapi";

const internalEndpoints = ENDPOINTS.filter((e) => e.exposure === "internal");
const internalSlugs = internalEndpoints.map((e) => e.slug);
const publicEndpoints = listPublic();

const manifest = buildManifest();
const manifestText = JSON.stringify(manifest);
const openapi = buildOpenApi();
const openapiText = JSON.stringify(openapi);
const llmsTxt = buildLlmsTxt();

describe("discovery: internal endpoints never leak", () => {
  it("has internal endpoints to guard against", () => {
    expect(internalEndpoints.length).toBe(180);
  });

  it("excludes every internal slug from the manifest, OpenAPI, and llms.txt", () => {
    for (const slug of internalSlugs) {
      expect(manifestText).not.toContain(slug);
      expect(openapiText).not.toContain(slug);
      expect(llmsTxt).not.toContain(slug);
    }
  });

  it("never references task_get / tasks_ready in any artifact", () => {
    for (const text of [manifestText, openapiText, llmsTxt]) {
      expect(text).not.toContain("task_get");
      expect(text).not.toContain("tasks_ready");
    }
  });

  it("only lists endpoints that resolve to a public registry entry", () => {
    for (const entry of manifest.endpoints) {
      expect(getBySlug(entry.slug)?.exposure).toBe("public");
    }
  });
});

describe("discovery: manifest pricing", () => {
  it("covers exactly the public endpoints", () => {
    expect(manifest.endpoints.length).toBe(publicEndpoints.length);
    expect(manifest.endpointCount).toBe(publicEndpoints.length);
  });

  it("prices every billable endpoint above zero", () => {
    for (const entry of manifest.endpoints) {
      if (!entry.billable) continue;
      expect(entry.price.micros).toBeGreaterThan(0);
      expect(entry.price.usd).toBeGreaterThan(0);
    }
  });

  it("formats prices without precision loss", () => {
    for (const entry of manifest.endpoints) {
      const parsed = Number.parseFloat(entry.price.formatted.replace(/^\$/, ""));
      // parseFloat is exactly how x402's money parser reads the string.
      expect(Math.round(parsed * 1_000_000)).toBe(entry.price.micros);
    }
  });

  it("keeps sub-cent prices from collapsing to $0.00", () => {
    const subCent = manifest.endpoints.filter((e) => e.billable && e.price.usd < 0.01);
    expect(subCent.length).toBeGreaterThan(0);
    for (const entry of subCent) {
      expect(entry.price.formatted).not.toBe("$0.00");
      expect(entry.price.formatted).not.toBe("$0");
    }
  });
});

describe("discovery: OpenAPI 3.1", () => {
  it("declares OpenAPI 3.1 and the 2020-12 schema dialect", () => {
    expect(openapi.openapi).toBe("3.1.0");
    expect(openapi.jsonSchemaDialect).toBe("https://json-schema.org/draft/2020-12/schema");
  });

  it("has exactly one path per public endpoint", () => {
    const paths = openapi.paths as Record<string, unknown>;
    expect(Object.keys(paths).length).toBe(publicEndpoints.length);
  });

  it("exposes x-price extensions on every operation", () => {
    const paths = openapi.paths as Record<string, Record<string, Record<string, unknown>>>;
    for (const [, methods] of Object.entries(paths)) {
      for (const op of Object.values(methods)) {
        expect(op).toHaveProperty("x-price-usd");
        expect(op).toHaveProperty("x-price-confidence");
      }
    }
  });

  it("documents the x402 402 response with its header on billable operations", () => {
    const paths = openapi.paths as Record<string, Record<string, Record<string, unknown>>>;
    for (const methods of Object.values(paths)) {
      for (const op of Object.values(methods)) {
        if (op["x-billable"] !== true) continue;
        const responses = op.responses as Record<string, unknown>;
        expect(responses).toHaveProperty("402");
      }
    }
    const components = openapi.components as { responses: Record<string, unknown> };
    expect(components.responses).toHaveProperty("PaymentRequired");
  });
});

describe("discovery: estimated price disclosure", () => {
  const estimatedPublic = publicEndpoints.filter((e) => e.priceConfidence === "estimated");

  it("has 22 estimated public endpoints", () => {
    expect(estimatedPublic.length).toBe(22);
  });

  it("marks and discloses every estimated price in the manifest", () => {
    const estimated = manifest.endpoints.filter((e) => e.price.confidence === "estimated");
    expect(estimated.length).toBe(22);
    for (const entry of estimated) {
      expect(entry.price.disclosure).toBeTruthy();
    }
  });

  it("surfaces estimated confidence on the matching OpenAPI operations", () => {
    const paths = openapi.paths as Record<string, Record<string, Record<string, unknown>>>;
    let estimatedOps = 0;
    for (const methods of Object.values(paths)) {
      for (const op of Object.values(methods)) {
        if (op["x-price-confidence"] === "estimated") estimatedOps += 1;
      }
    }
    expect(estimatedOps).toBe(22);
  });
});

describe("discovery: llms.txt signpost", () => {
  it("links the manifest and OpenAPI and lists groups, not all endpoints", () => {
    expect(llmsTxt).toContain("/api/v3/manifest");
    expect(llmsTxt).toContain("/openapi.json");
    expect(llmsTxt).toContain("## Endpoint groups");
    // A signpost, not a dump: far shorter than enumerating 351 endpoints.
    expect(llmsTxt.length).toBeLessThan(4000);
  });
});
