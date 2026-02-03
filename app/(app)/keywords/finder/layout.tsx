import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keyword Finder — Based SEO",
  description:
    "Discover thousands of keyword ideas from a seed keyword. Filter by volume, difficulty, intent, and more. Pay‑per‑search.",
  alternates: { canonical: "/keywords/finder" },
  openGraph: {
    title: "Keyword Finder — Based SEO",
    description: "Bulk keyword discovery with real DataForSEO data. No subscription required.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
