import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backlinks Summary — Based SEO",
  description:
    "Analyze any domain's backlink profile: total backlinks, referring domains, domain rank, dofollow ratio, new and lost links, and anchor text distribution. Pay‑per‑search.",
  alternates: { canonical: "/backlinks" },
  openGraph: {
    title: "Backlinks Summary — Based SEO",
    description: "Professional backlink analysis without subscriptions. Powered by DataForSEO.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
