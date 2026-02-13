import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/api-middleware";
import { requireX402Payment } from "@/lib/x402-guard";
import { runFullAudit } from "@/lib/seo-audit";

export const maxDuration = 60; // Allow up to 60 seconds for full audit

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const pay = await requireX402Payment(request);
  if (!pay.ok) return pay.response;

  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Basic URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Don't allow localhost or private IPs
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    ) {
      return NextResponse.json({ error: "Cannot audit local or private URLs" }, { status: 400 });
    }

    // Run the full audit
    const auditResult = await runFullAudit(parsedUrl.href);

    const res = NextResponse.json({
      data: auditResult,
    });

    // Add payment settlement headers
    for (const [k, v] of Object.entries(pay.settleHeaders)) {
      res.headers.set(k, v);
    }

    return res;
  } catch (err: unknown) {
    console.error("Audit API error:", err);

    if (err instanceof Error) {
      if (err.message.includes("Failed to fetch")) {
        return NextResponse.json(
          { error: "Could not fetch the URL. Make sure the site is accessible." },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
