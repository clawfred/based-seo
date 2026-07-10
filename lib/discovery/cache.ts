/**
 * Module-scope memoization for the discovery artifacts.
 *
 * The manifest, OpenAPI doc, and llms.txt are pure functions of the registry
 * plus stable process env, so they are generated once per process and reused.
 * Route handlers pull the serialized form from here and do no per-request work.
 */

import { buildLlmsTxt } from "./llms-txt";
import { buildManifest } from "./manifest";
import { buildOpenApi } from "./openapi";

let manifestJson: string | undefined;
let openApiJson: string | undefined;
let llmsTxt: string | undefined;

/** Manifest, serialized once. */
export function getManifestJson(): string {
  return (manifestJson ??= JSON.stringify(buildManifest()));
}

/** OpenAPI 3.1 document, serialized once. */
export function getOpenApiJson(): string {
  return (openApiJson ??= JSON.stringify(buildOpenApi()));
}

/** llms.txt body, built once. */
export function getLlmsTxt(): string {
  return (llmsTxt ??= buildLlmsTxt());
}
