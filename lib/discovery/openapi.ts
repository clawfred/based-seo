/**
 * Generate an OpenAPI 3.1 document from the endpoint registry.
 *
 * One public endpoint becomes one path. OpenAPI has no native notion of
 * payment, so the x402 price is carried on each operation as `x-price-*`
 * extensions and the 402 handshake is documented with its v2 headers. Internal
 * task-retrieval endpoints never appear: paths come only from `listPublic()`.
 *
 * components.schemas use JSON Schema draft-2020-12, the dialect OpenAPI 3.1
 * mandates (declared via `jsonSchemaDialect`).
 */

import { listGroups, listPublic } from "@/lib/registry";
import type { EndpointDef } from "@/lib/registry";
import { quote } from "@/lib/registry/pricing";
import { normalizeParams, paramType } from "./params";
import { resolveX402Info } from "./x402-info";

type Json = Record<string, unknown>;

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "https://based-seo.com";

/** First sentence of a description, for the operation summary. */
function summarize(description: string): string {
  const dot = description.indexOf(". ");
  return dot === -1 ? description : description.slice(0, dot + 1);
}

function pathTemplate(endpoint: EndpointDef): string {
  const base = `/api/v3/${endpoint.slug}`;
  return endpoint.pathParams.reduce((p, name) => `${p}/{${name}}`, base);
}

function pathParameters(endpoint: EndpointDef): Json[] {
  return endpoint.pathParams.map((name) => ({
    name,
    in: "path",
    required: true,
    schema: { type: paramType(name) },
  }));
}

/** Task-object schema: properties, plain required, and one-of-N required groups. */
function taskSchema(endpoint: EndpointDef): Json {
  const { properties, required, requiredOneOf } = normalizeParams(endpoint);
  const schema: Json = {
    type: "object",
    additionalProperties: true,
    properties,
  };
  if (required.length > 0) schema.required = required;
  if (requiredOneOf.length > 0) {
    // Each group contributes an anyOf("at least one present"); all groups must
    // hold, so they are combined under allOf.
    schema.allOf = requiredOneOf.map((group) => ({
      anyOf: group.map((name) => ({ required: [name] })),
    }));
  }
  return schema;
}

function requestBody(endpoint: EndpointDef): Json | undefined {
  if (endpoint.method !== "POST") return undefined;
  return {
    required: true,
    description:
      "DataForSEO accepts an array of task objects; you are billed per task in the array.",
    content: {
      "application/json": {
        schema: { type: "array", minItems: 1, items: taskSchema(endpoint) },
      },
    },
  };
}

function successResponse(endpoint: EndpointDef): Json {
  const response: Json = {
    description: "Result from DataForSEO, proxied verbatim.",
    content: { "application/json": { schema: { type: "object" } } },
  };
  if (endpoint.billable) {
    response.headers = {
      "PAYMENT-RESPONSE": {
        description: "x402 v2 settlement receipt (transaction hash, network).",
        schema: { type: "string" },
      },
    };
  }
  return response;
}

function responses(endpoint: EndpointDef): Json {
  const out: Json = {
    "200": successResponse(endpoint),
    "400": { $ref: "#/components/responses/BadRequest" },
  };
  if (endpoint.billable) out["402"] = { $ref: "#/components/responses/PaymentRequired" };
  return out;
}

function operation(endpoint: EndpointDef): Json {
  const q = quote(endpoint);
  const params = [...pathParameters(endpoint)];
  if (endpoint.billable) params.push({ $ref: "#/components/parameters/PaymentSignature" });

  const op: Json = {
    operationId: endpoint.id,
    summary: summarize(endpoint.description),
    description: endpoint.description,
    tags: [endpoint.group],
    "x-billable": endpoint.billable,
    "x-price-usd": q.usd,
    "x-price-formatted": q.formatted,
    "x-price-confidence": q.confidence,
    responses: responses(endpoint),
  };
  if (params.length > 0) op.parameters = params;
  const body = requestBody(endpoint);
  if (body) op.requestBody = body;
  return op;
}

function components(): Json {
  return {
    parameters: {
      PaymentSignature: {
        name: "PAYMENT-SIGNATURE",
        in: "header",
        required: false,
        description:
          "x402 v2 payment signature (EIP-3009 USDC authorization). Sent on the " +
          "retry after receiving a 402; omit it on the first request.",
        schema: { type: "string" },
      },
    },
    responses: {
      PaymentRequired: {
        description:
          "Payment required (x402 v2). Read the PAYMENT-REQUIRED header for the " +
          "payment requirements, then retry with a PAYMENT-SIGNATURE header.",
        headers: {
          "PAYMENT-REQUIRED": {
            description:
              "x402 payment requirements: accepts[] with scheme, network, amount, asset, payTo.",
            schema: { type: "string" },
          },
        },
        content: { "application/json": { schema: { type: "object" } } },
      },
      BadRequest: {
        description: "Missing or malformed required parameters. No payment is taken.",
        content: { "application/json": { schema: { type: "object" } } },
      },
    },
  };
}

export function buildOpenApi(): Json {
  const pay = resolveX402Info();
  const paths: Json = {};
  for (const endpoint of listPublic()) {
    paths[pathTemplate(endpoint)] = { [endpoint.method.toLowerCase()]: operation(endpoint) };
  }

  return {
    openapi: "3.1.0",
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    info: {
      title: "based-seo DataForSEO Gateway",
      version: "1.0.0",
      description:
        "Pay-per-call SEO/GEO API. Each billable operation is paid per request in " +
        "USDC via x402 on Base — no account required. Send the request; on a 402, " +
        "read the PAYMENT-REQUIRED header and retry with PAYMENT-SIGNATURE. " +
        `Network: ${pay.network ?? "set via X402_NETWORK"}. ` +
        "Prices are exposed per operation as x-price-usd / x-price-confidence.",
    },
    servers: [{ url: SITE }],
    tags: listGroups().map((name) => ({ name })),
    paths,
    components: components(),
  };
}
