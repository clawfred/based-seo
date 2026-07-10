/**
 * End-to-end x402 exercise against the local server on Base Sepolia.
 *
 * Uses an ephemeral, UNFUNDED private key. This proves the full protocol
 * pipeline -- 402 challenge -> decode -> EIP-712 sign -> PAYMENT-SIGNATURE
 * header -> server decode -> facilitator /verify -- and stops at the one step
 * that requires testnet USDC in the wallet. The facilitator's rejection reason
 * is the evidence: an "insufficient funds"-class error means everything up to
 * the on-chain transfer is wired correctly, whereas a malformed-payload or
 * signature error would mean it is not.
 */

import { x402Client, x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ENDPOINT = "/api/v3/backlinks/summary/live";
const BODY = { target: "example.com" };

const pk = process.env.TEST_PRIVATE_KEY ?? generatePrivateKey();
const account = privateKeyToAccount(pk);
console.log(`payer (ephemeral EOA): ${account.address}`);
console.log(
  `funded: ${process.env.TEST_PRIVATE_KEY ? "possibly (key supplied)" : "NO (generated)"}\n`,
);

const signer = {
  address: account.address,
  signTypedData: async (msg) =>
    account.signTypedData({
      domain: msg.domain,
      types: msg.types,
      primaryType: msg.primaryType,
      message: msg.message,
    }),
};

const core = new x402Client();
registerExactEvmScheme(core, { signer });
const http = new x402HTTPClient(core);

// ---- step 1: unpaid request, expect a 402 challenge -------------------------
const first = await fetch(BASE + ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(BODY),
});
console.log(`1. unpaid POST      -> HTTP ${first.status}`);
if (first.status !== 402) {
  console.error("   expected 402; aborting");
  process.exit(1);
}

const firstBody = await first.text();
const challenge = http.getPaymentRequiredResponse(
  (name) => first.headers.get(name),
  firstBody ? JSON.parse(firstBody) : undefined,
);
const req = challenge.accepts[0];
console.log(`   challenge: ${req.amount} atomic ${req.asset} on ${req.network} -> ${req.payTo}`);

// ---- step 2: sign an EIP-3009 authorization --------------------------------
const payload = await http.createPaymentPayload(challenge);
const headers = http.encodePaymentSignatureHeader(payload);
const headerName = Object.keys(headers)[0];
console.log(
  `\n2. signed payload   -> header ${headerName} (${headers[headerName].length} bytes b64)`,
);

const decoded = JSON.parse(Buffer.from(headers[headerName], "base64").toString());
console.log(`   scheme=${decoded.scheme} network=${decoded.network}`);
console.log(`   from=${decoded.payload?.authorization?.from}`);
console.log(`   to  =${decoded.payload?.authorization?.to}`);
console.log(`   value=${decoded.payload?.authorization?.value}`);
console.log(`   signature present: ${Boolean(decoded.payload?.signature)}`);

// ---- step 3: retry with payment; facilitator verifies ----------------------
const second = await fetch(BASE + ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json", ...headers },
  body: JSON.stringify(BODY),
});
const secondBody = await second.text();
console.log(`\n3. paid POST        -> HTTP ${second.status}`);
console.log(`   x-charge-source: ${second.headers.get("x-charge-source") ?? "(none)"}`);
console.log(
  `   payment-response: ${second.headers.get("payment-response") ? "present" : "(none)"}`,
);
console.log(`   body: ${secondBody.slice(0, 300)}`);

// x402 reports the rejection reason in the PAYMENT-REQUIRED header, not the body.
let reasonText = secondBody;
const pr = second.headers.get("payment-required");
if (pr) {
  try {
    const decodedPr = JSON.parse(Buffer.from(pr, "base64").toString());
    console.log(`   PAYMENT-REQUIRED.error: ${JSON.stringify(decodedPr.error)}`);
    reasonText += " " + JSON.stringify(decodedPr);
  } catch (e) {
    console.log(`   PAYMENT-REQUIRED undecodable: ${e.message}`);
  }
}
for (const [k, v] of second.headers.entries()) {
  if (/^(payment|x-)/i.test(k)) console.log(`   hdr ${k}: ${String(v).slice(0, 80)}`);
}

// ---- interpretation --------------------------------------------------------
console.log("\n── interpretation ──");
if (second.status === 200) {
  console.log("   SETTLED on-chain. Full loop verified end to end.");
} else if (second.status === 402) {
  const reason = reasonText.toLowerCase();
  if (/insufficient|balance|funds/.test(reason)) {
    console.log("   Facilitator ACCEPTED the payload and rejected it for lack of USDC.");
    console.log("   => challenge, signing, header encoding, server decode, and the");
    console.log("      facilitator round-trip all work. Only funding is missing.");
  } else if (/signature|invalid|malformed|scheme|network/.test(reason)) {
    console.log("   Facilitator rejected the PAYLOAD ITSELF -- a real wiring bug.");
    process.exitCode = 1;
  } else {
    console.log("   402 with an unrecognised reason; inspect the body above.");
  }
} else {
  console.log(`   Unexpected status ${second.status} -- inspect the body above.`);
  process.exitCode = 1;
}
