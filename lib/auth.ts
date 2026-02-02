import { NextRequest, NextResponse } from "next/server";
import { privyClient } from "@/lib/privy";

export interface AuthenticatedUser {
  userId: string;
  walletAddress?: string;
  email?: string;
}

/**
 * Verify Privy access token from Authorization header
 * @param request - Next.js request object
 * @returns Authenticated user info or null if invalid
 */
export async function verifyAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const accessToken = authHeader.slice(7);
    const verifiedClaims = await privyClient.verifyAuthToken(accessToken);
    const userId = verifiedClaims.userId;

    if (!userId) {
      return null;
    }

    return {
      userId,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Extract user ID from authenticated request
 * Throws error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<string> {
  const user = await verifyAuth(request);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user.userId;
}
