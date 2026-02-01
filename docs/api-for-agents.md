# Paying for API Access (x402)

## Overview

Based SEO API endpoints use the x402 protocol for payment. No API keys, no subscriptions—just pay-per-request with USDC on Base. Any client with a wallet can pay automatically by handling 402 responses.

## Paid Endpoints

| Endpoint                 | Method | Price  | Description                                      |
| ------------------------ | ------ | ------ | ------------------------------------------------ |
| `/api/keywords/overview` | POST   | $0.03  | Keyword metrics, SERP results, and keyword ideas |
| `/api/keywords/ideas`    | POST   | $0.025 | Keyword suggestions and related terms            |

Request body for both:

```json
{
  "keyword": "seo tools",
  "location_code": 2840,
  "language_code": "en"
}
```

## How It Works (the 402 flow)

1. Client sends a normal POST request
2. Server returns `402 Payment Required` with a `Payment-Required` header (base64-encoded payment requirements)
3. Client parses requirements, signs an EIP-712 payment authorization with their wallet
4. Client retries the same request with a `PAYMENT-SIGNATURE` header containing the signed payment
5. Server verifies payment via the x402 facilitator, processes the request, and returns data
6. Payment is settled on-chain (USDC on Base, network eip155:8453)

## Quick Start (TypeScript)

```typescript
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

// 1. Set up wallet
const account = privateKeyToAccount("0xYOUR_PRIVATE_KEY");

// 2. Set up x402 client
const client = new x402Client();
registerExactEvmScheme(client, {
  signer: {
    address: account.address,
    signTypedData: async (msg) =>
      account.signTypedData({
        domain: msg.domain,
        types: msg.types,
        primaryType: msg.primaryType,
        message: msg.message,
      }),
  },
});
const httpClient = new x402HTTPClient(client);

// 3. Make request
const res = await fetch("https://based-seo.com/api/keywords/overview", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    keyword: "seo tools",
    location_code: 2840,
    language_code: "en",
  }),
});

if (res.status === 402) {
  // 4. Parse payment requirements
  const body = await res.text();
  const paymentRequired = httpClient.getPaymentRequiredResponse(
    (name) => res.headers.get(name),
    body ? JSON.parse(body) : undefined,
  );

  // 5. Sign payment
  const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

  // 6. Retry with payment
  const paidRes = await fetch("https://based-seo.com/api/keywords/overview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...paymentHeaders,
    },
    body: JSON.stringify({
      keyword: "seo tools",
      location_code: 2840,
      language_code: "en",
    }),
  });

  const data = await paidRes.json();
  console.log(data);
}
```

## Requirements

- A wallet with USDC on Base (chain ID 8453)
- npm packages: `@x402/core`, `@x402/evm`, `viem`

## Free Endpoints

These don't require payment:

- `GET /api/health` — Health check

## Learn More

- [x402 Protocol](https://x402.org)
- [x402 GitHub](https://github.com/coinbase/x402)
