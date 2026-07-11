import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://based-seo.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/logo.png",
  },
  title: {
    default: "Based SEO: the SEO & GEO API your AI agents can pay for themselves",
    template: "%s | Based SEO",
  },
  description:
    "Every DataForSEO endpoint - keywords, backlinks, site audits, SERPs, and AI-search visibility - behind one API. A human uses the dashboard; an agent pays per call in USDC over x402. No subscription, no account, no API key.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Based SEO",
    title: "Based SEO: the SEO & GEO API your AI agents can pay for themselves",
    description:
      "531 SEO & GEO endpoints, paid per request in USDC via x402. For people and their AI agents. No subscription. Powered by DataForSEO.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Based SEO: SEO & GEO data, paid per request via x402",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Based SEO: the SEO & GEO API your AI agents can pay for themselves",
    description:
      "531 SEO & GEO endpoints, paid per request in USDC via x402. Powered by DataForSEO.",
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
      "531 SEO & GEO endpoints - keywords, backlinks, site audits, SERPs, and AI-search visibility - paid per request in USDC via x402. For people and their AI agents. Powered by DataForSEO.",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
