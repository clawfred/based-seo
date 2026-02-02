"use client";

import { useEffect } from "react";
import { setWagmiConfig } from "@/lib/api";
import type { Config } from "wagmi";

export function useWagmiConfig(config: Config) {
  useEffect(() => {
    setWagmiConfig(config);
  }, [config]);
}
