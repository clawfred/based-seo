import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Domain Overview — Based SEO",
  description:
    "Analyze any domain: organic traffic, keywords, backlinks, rankings, traffic cost, and trends. Pay-per-search domain analysis.",
  alternates: { canonical: "/domain/overview" },
  openGraph: {
    title: "Domain Overview — Based SEO",
    description:
      "Professional domain analysis without subscriptions. Get competitor insights powered by DataForSEO.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
