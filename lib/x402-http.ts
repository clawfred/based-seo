import { x402HTTPResourceServer } from "@x402/core/http";
import type { NextRequest } from "next/server";

import { routes, server } from "@/lib/x402";

// Singleton initializer to avoid re-fetching facilitator supported kinds on every request.
let _httpServer: x402HTTPResourceServer | null = null;
let _initPromise: Promise<void> | null = null;

export function getX402HttpServer(): x402HTTPResourceServer {
  if (_httpServer) return _httpServer;
  _httpServer = new x402HTTPResourceServer(server, routes);
  return _httpServer;
}

export async function initX402HttpServerOnce(): Promise<void> {
  if (_initPromise) return _initPromise;

  const httpServer = getX402HttpServer();
  _initPromise = httpServer.initialize();
  return _initPromise;
}

// Minimal adapter for NextRequest -> x402 HTTPAdapter.
export function makeNextRequestAdapter(req: NextRequest) {
  const url = new URL(req.url);
  return {
    getHeader: (name: string) => req.headers.get(name) ?? undefined,
    getMethod: () => req.method,
    getPath: () => url.pathname,
    getUrl: () => req.url,
    getAcceptHeader: () => req.headers.get("accept") ?? "",
    getUserAgent: () => req.headers.get("user-agent") ?? "",
  };
}
