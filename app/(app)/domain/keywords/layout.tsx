import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitor Keywords | Based SEO",
  description:
    "Discover what keywords your competitors rank for. Analyze their organic positions, search volumes, and traffic estimates to find opportunities.",
  openGraph: {
    title: "Competitor Keywords | Based SEO",
    description:
      "Discover what keywords your competitors rank for. Analyze their organic positions, search volumes, and traffic estimates to find opportunities.",
  },
};

export default function CompetitorKeywordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
