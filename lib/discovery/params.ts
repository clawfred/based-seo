/**
 * Normalize a registry endpoint's `required`/`optional` param lists into a
 * form the manifest and the OpenAPI generator can both consume.
 *
 * A required token may be an alternation like `"location_name|location_code"`,
 * meaning "supply at least one of these". Plain tokens are ordinary required
 * fields. Optional tokens are always plain.
 */

import { PARAM_TYPES } from "@/lib/registry";
import type { EndpointDef } from "@/lib/registry";

/** JSON-Schema type for a param name, defaulting to string when unknown. */
export function paramType(name: string): string {
  return PARAM_TYPES[name] ?? "string";
}

export interface NormalizedParams {
  /** Every param name (all alternatives + optionals) → its JSON-Schema type. */
  readonly properties: Record<string, { type: string }>;
  /** Names that are unconditionally required. */
  readonly required: string[];
  /** Each group is a set of alternatives; at least one per group is required. */
  readonly requiredOneOf: string[][];
  readonly optional: string[];
}

export function normalizeParams(endpoint: EndpointDef): NormalizedParams {
  const properties: Record<string, { type: string }> = {};
  const required: string[] = [];
  const requiredOneOf: string[][] = [];

  for (const token of endpoint.required) {
    const alternatives = token.split("|").filter(Boolean);
    for (const name of alternatives) properties[name] = { type: paramType(name) };
    if (alternatives.length === 1) required.push(alternatives[0]);
    else if (alternatives.length > 1) requiredOneOf.push(alternatives);
  }

  const optional: string[] = [];
  for (const name of endpoint.optional) {
    properties[name] = { type: paramType(name) };
    optional.push(name);
  }

  return { properties, required, requiredOneOf, optional };
}

/** The subset of PARAM_TYPES referenced by this endpoint, for the manifest. */
export function paramTypesFor(endpoint: EndpointDef): Record<string, string> {
  const names = new Set<string>();
  for (const token of endpoint.required) token.split("|").forEach((n) => n && names.add(n));
  for (const name of endpoint.optional) names.add(name);
  const out: Record<string, string> = {};
  for (const name of [...names].sort()) out[name] = paramType(name);
  return out;
}
