import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GEO Tracker - Track Brand Visibility in AI Search | Based SEO",
  description:
    "Track your brand's visibility in AI-powered search results. See if ChatGPT, Claude, Perplexity, and Google AI Overview mention your brand.",
  keywords: [
    "GEO tracking",
    "AI search optimization",
    "ChatGPT brand visibility",
    "Claude AI visibility",
    "Perplexity SEO",
    "Google AI Overview",
    "generative engine optimization",
  ],
  openGraph: {
    title: "GEO Tracker - AI Search Visibility | Based SEO",
    description:
      "The first affordable tool to track brand visibility in ChatGPT, Claude, Perplexity, and Google AI Overview.",
  },
};

export default function GeoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
