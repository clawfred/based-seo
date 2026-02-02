import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@coinbase/onchainkit/styles.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ApplicationShell } from "@/components/layout/application-shell";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://based-seo.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/logo.png",
  },
  title: {
    default: "Based SEO — Pay‑per‑search keyword research",
    template: "%s | Based SEO",
  },
  description:
    "Pay‑per‑search SEO research: keyword volume, difficulty, CPC, competition, SERP analysis, and more — without subscriptions. Powered by DataForSEO.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Based SEO",
    title: "Based SEO — Pay‑per‑search SEO tools",
    description:
      "Keyword research + SERP insights without subscriptions. Pay per request (x402). Powered by DataForSEO.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Based SEO — SEO data without markup, pay per use via x402",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Based SEO — Pay‑per‑search SEO tools",
    description: "Keyword research + SERP insights without subscriptions. Pay per request (x402).",
    images: ["/og-image.png"],
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
  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Based SEO",
    description:
      "Pay‑per‑search SEO research: keyword volume, difficulty, CPC, competition, SERP analysis, and more — without subscriptions. Powered by DataForSEO.",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/keywords/overview?keywords={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        <Providers>
          <ApplicationShell>{children}</ApplicationShell>
        </Providers>
      </body>
    </html>
  );
}
