import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Keywords — Based SEO",
  description:
    "Organize your keyword research into folders. Save keywords from Keyword Finder or Overview for easy access later.",
  openGraph: {
    title: "Saved Keywords — Based SEO",
    description: "Organize and revisit your keyword research.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
