import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasCdpKeyId: !!process.env.CDP_API_KEY_ID,
    hasCdpKeySecret: !!process.env.CDP_API_KEY_SECRET,
    hasEvmAddress: !!process.env.EVM_ADDRESS,
    cdpKeyIdPreview: process.env.CDP_API_KEY_ID?.slice(0, 8) + "...",
  });
}
