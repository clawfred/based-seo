import { db } from "@/db";
import { paymentTransactions } from "@/db/schema";
import { nanoid } from "nanoid";

interface SettlementData {
  payer: string;
  transaction: string;
  network: string;
  requirements: {
    amount: string;
    asset: string;
  };
}

export async function logPaymentTransaction(
  settlementData: SettlementData,
  endpoint: string,
  userId?: string,
): Promise<void> {
  if (!db) {
    console.warn("[Payment Logger] Database not configured, skipping transaction log");
    return;
  }

  try {
    await db.insert(paymentTransactions).values({
      id: nanoid(),
      userId: userId || null,
      payerAddress: settlementData.payer,
      transactionHash: settlementData.transaction,
      network: settlementData.network,
      endpoint,
      amount: settlementData.requirements.amount,
      asset: settlementData.requirements.asset,
      status: "success",
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Payment Logger] Failed to log transaction:", error);
  }
}
