import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@coinbase/onchainkit/styles.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ApplicationShell } from "@/components/layout/application-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Based SEO — Pay‑per‑search keyword research",
    template: "%s | Based SEO",
  },
  description:
    "Pay‑per‑search SEO research: keyword volume, difficulty, CPC, competition, SERP analysis, and more — without subscriptions. Powered by DataForSEO.",
  metadataBase: new URL("https://based-seo.com"),
  openGraph: {
    type: "website",
    siteName: "Based SEO",
    title: "Based SEO — Pay‑per‑search SEO tools",
    description:
      "Keyword research + SERP insights without subscriptions. Pay per request (x402). Powered by DataForSEO.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Based SEO — Pay‑per‑search SEO tools",
    description: "Keyword research + SERP insights without subscriptions. Pay per request (x402).",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ApplicationShell>{children}</ApplicationShell>
        </Providers>
      </body>
    </html>
  );
}
