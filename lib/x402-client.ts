import { x402Client, x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import type { ClientEvmSigner } from "@x402/evm";
import type { WalletClient } from "viem";

function adaptWalletClient(walletClient: WalletClient): ClientEvmSigner {
  const account = walletClient.account;
  if (!account) {
    throw new Error("WalletClient has no account connected");
  }

  return {
    address: account.address,
    signTypedData: async (message: {
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
    }) => {
      return walletClient.signTypedData({
        account: account.address,
        domain: message.domain,
        types: message.types,
        primaryType: message.primaryType,
        message: message.message,
      } as Parameters<typeof walletClient.signTypedData>[0]);
    },
  };
}

function buildX402HttpClient(walletClient: WalletClient): x402HTTPClient {
  const signer = adaptWalletClient(walletClient);
  const client = new x402Client();
  registerExactEvmScheme(client, { signer });
  return new x402HTTPClient(client);
}

export async function x402Fetch(
  url: string,
  body: Record<string, unknown>,
  walletClient: WalletClient,
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  const httpClient = buildX402HttpClient(walletClient);

  // 1. Make normal request
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
    body: JSON.stringify(body),
  });

  if (res.status !== 402) {
    return res;
  }

  // 2. Extract payment requirements from the 402 response
  const resBody = await res.text();
  const paymentRequired = httpClient.getPaymentRequiredResponse(
    (name: string) => res.headers.get(name),
    resBody ? JSON.parse(resBody) : undefined,
  );

  // 3. Create signed payment payload
  const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);

  // 4. Encode into HTTP headers
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

  // 5. Retry with payment header
  const retryRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(extraHeaders ?? {}),
      ...paymentHeaders,
    },
    body: JSON.stringify(body),
  });

  // 6. If still 402, extract error details for debugging
  if (retryRes.status === 402) {
    const errorBody = await retryRes.text();
    console.error("[x402] Payment rejected by facilitator:", errorBody);
    throw new Error(
      "Payment signature rejected. If using a smart wallet, the facilitator may not support EIP-1271 verification yet. Try an EOA wallet (e.g. MetaMask).",
    );
  }

  return retryRes;
}
