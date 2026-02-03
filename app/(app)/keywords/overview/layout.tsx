import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keyword Overview — Based SEO",
  description:
    "Get comprehensive keyword insights: search volume, difficulty, CPC, competition, trends, SERP analysis, and related keywords. Pay‑per‑search.",
  alternates: { canonical: "/keywords/overview" },
  openGraph: {
    title: "Keyword Overview — Based SEO",
    description: "Professional keyword research without subscriptions. Powered by DataForSEO.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
