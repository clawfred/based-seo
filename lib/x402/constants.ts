/** Mount point for the paid passthrough API (agent-facing, 1:1 with DataForSEO). */
export const API_PREFIX = "/api/v3";

/** Mount point for composite products (dashboard-facing, several upstream calls per charge). */
export const PRODUCT_PREFIX = "/api/products";

/** x402 v2 header names, as implemented by @x402/core 2.2.0. */
export const HEADER_PAYMENT_REQUIRED = "PAYMENT-REQUIRED";
export const HEADER_PAYMENT_SIGNATURE = "PAYMENT-SIGNATURE";
export const HEADER_PAYMENT_RESPONSE = "PAYMENT-RESPONSE";

/** Advisory headers describing how a request was charged. Never load-bearing. */
export const HEADER_CHARGE_SOURCE = "X-Charge-Source";
export const HEADER_CHARGE_AMOUNT = "X-Charge-Amount";
export const HEADER_BALANCE_REMAINING = "X-Balance-Remaining";
export const HEADER_IDEMPOTENCY_KEY = "Idempotency-Key";
