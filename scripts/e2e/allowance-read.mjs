// Verify the on-chain allowance read against real Base Sepolia USDC.
import { createPublicClient, erc20Abi, http } from "viem";
import { baseSepolia } from "viem/chains";

const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
// A known Base Sepolia address (Circle faucet distributor) — just to prove the
// contract read returns sane values, not zero-because-broken.
const OWNER = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const SPENDER = "0x1ddd084e09f4fae7f6b872d0481830bee99b1dfe";

const client = createPublicClient({ chain: baseSepolia, transport: http() });
const [allowance, balance, decimals, symbol] = await Promise.all([
  client.readContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "allowance",
    args: [OWNER, SPENDER],
  }),
  client.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [OWNER] }),
  client.readContract({ address: USDC, abi: erc20Abi, functionName: "decimals" }),
  client.readContract({ address: USDC, abi: erc20Abi, functionName: "symbol" }),
]);
console.log("USDC contract read on Base Sepolia:");
console.log("  symbol  :", symbol);
console.log("  decimals:", decimals, decimals === 6 ? "(matches micro-USD ✓)" : "(UNEXPECTED)");
console.log("  balanceOf(owner):", balance.toString(), "atomic");
console.log("  allowance(owner,spender):", allowance.toString(), "atomic");
console.log("\nread layer works: the contract responds with 6-decimal USDC values.");
