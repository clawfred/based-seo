/**
 * Turns an endpoint's declared params into form-field descriptors for the
 * generic explorer. Kept separate from the registry so the UI's presentation
 * concerns never leak into the source-of-truth data.
 */

import { PARAM_TYPES } from "./endpoints.generated";
import { alternatives } from "./index";
import type { EndpointDef } from "./types";

export type FieldKind = "string" | "number" | "boolean" | "array" | "object";

export interface ParamField {
  /** The name sent to the API. For an alternation, the first alternative. */
  readonly name: string;
  /** All accepted names, when the requirement is an either/or. */
  readonly aliases: readonly string[];
  readonly required: boolean;
  readonly kind: FieldKind;
  /** A sensible starting value for common params, e.g. location_code -> 2840. */
  readonly placeholder?: string;
}

const COMMON_PLACEHOLDERS: Record<string, string> = {
  location_code: "2840",
  language_code: "en",
  location_name: "United States",
  language_name: "English",
  keyword: "seo tools",
  target: "example.com",
  domain: "example.com",
  url: "https://example.com",
  limit: "10",
  depth: "10",
};

function kindOf(name: string): FieldKind {
  const t = PARAM_TYPES[name];
  if (t === "integer" || t === "number") return "number";
  if (t === "boolean") return "boolean";
  if (t === "array") return "array";
  if (t === "object") return "object";
  return "string";
}

function toField(spec: string, required: boolean): ParamField {
  const aliases = alternatives(spec);
  const name = aliases[0];
  return {
    name,
    aliases,
    required,
    kind: kindOf(name),
    placeholder: COMMON_PLACEHOLDERS[name],
  };
}

/** Required fields first, then the optional ones, de-duplicated by name. */
export function fieldsFor(endpoint: EndpointDef): ParamField[] {
  const seen = new Set<string>();
  const fields: ParamField[] = [];

  for (const spec of endpoint.required) {
    const f = toField(spec, true);
    if (!seen.has(f.name)) {
      seen.add(f.name);
      fields.push(f);
    }
  }
  for (const spec of endpoint.optional) {
    const f = toField(spec, false);
    if (!seen.has(f.name)) {
      seen.add(f.name);
      fields.push(f);
    }
  }
  return fields;
}
