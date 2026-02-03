"use client";

import Image from "next/image";
import Link from "next/link";

import { ConnectWallet } from "@/components/connect-wallet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { XIcon } from "@/components/icons/x-icon";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header
        className="sticky top-0 z-50 flex h-[4.5rem] w-full items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6"
        role="banner"
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 rounded-md hover:opacity-90">
            <Image
              src="/logo.png"
              alt="Based SEO"
              width={36}
              height={36}
              className="size-9 rounded-lg object-contain"
              priority
            />
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold leading-tight text-foreground md:text-base">
                Based SEO
              </span>
              <span className="text-[10px] leading-tight text-muted-foreground md:text-xs">
                SEO Tools
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/keywords/overview">Launch tools</Link>
          </Button>
          <ConnectWallet />
          <div className="hidden h-6 w-px bg-border md:block" aria-hidden />
          <Link
            href="https://x.com/openclawfred"
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Follow us on X"
          >
            <XIcon className="size-[18px]" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {children}
    </div>
  );
}
