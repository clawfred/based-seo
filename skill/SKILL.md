---
name: based-seo
description: Discover and call 350+ pay-per-request DataForSEO SEO/GEO endpoints (SERP, keywords, backlinks, on-page, AI-optimization, labs) paid per call in USDC via x402 on Base — no account or API key. Use when an agent needs SEO, SERP, keyword, backlink, or GEO data and can pay with a crypto wallet.
tags: [seo, geo, serp, keywords, backlinks, dataforseo, x402]
version: 1
metadata:
  clawdbot:
    emoji: "🔎"
    homepage: "https://based-seo.com"
---

# based-seo

Pay-per-call gateway to DataForSEO's SEO/GEO endpoints. No account, no API key: you
pay per request in USDC over x402 on Base. Discovery is free; only execution is paid.

## When to use

Use this when the user needs SEO/GEO data — search rankings (SERP), keyword volume and
ideas, backlinks, on-page audits, domain analytics, or AI-search visibility — and you
have a funded EVM wallet to pay per request.

## Step 1 — Discover the endpoint (free)

Fetch the manifest and pick the endpoint whose `slug` matches the task:

```
GET https://based-seo.com/api/v3/manifest
```

Each entry has `slug`, `method`, `group`, `description`, `required`/`optional` params,
and `price` (`usd`, `formatted`, `confidence`). A required token like
`"location_name|location_code"` means supply at least one of those. Prices with
`confidence: "estimated"` carry a `disclosure` — surface it to the user. For full
JSON Schema per endpoint, use `https://based-seo.com/openapi.json`.

## Step 2 — Call and pay (x402)

Call `POST https://based-seo.com/api/v3/{slug}` with a JSON body that is an ARRAY of
task objects (you are billed per task in the array).

1. Send the request. If payment is due you get **HTTP 402** with a `PAYMENT-REQUIRED`
   header describing amount, asset (USDC), network, and `payTo`.
2. Retry the identical request with a `PAYMENT-SIGNATURE` header — an EIP-3009 USDC
   authorization signed by your wallet. Use an x402 client (e.g. `x402-fetch`'s
   `wrapFetchWithPayment`) so this 402→pay→retry loop is automatic.
3. On success the response carries `PAYMENT-RESPONSE` (the settlement receipt) and the
   DataForSEO result body.

The network is the operator's choice (`base` for real USDC, `base-sepolia` for testnet);
read it from the 402, never hardcode it. Never send an API key — payment is the auth.

## Notes

- Validate required params before calling; a malformed request 400s free of charge.
- The manifest is the source of truth for the full list and current prices.
