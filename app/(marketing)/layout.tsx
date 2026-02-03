import { MarketingShell } from "@/components/layout/marketing-shell";

// Disable static generation for marketing routes (Privy hooks need client context)
export const dynamic = "force-dynamic";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MarketingShell>{children}</MarketingShell>;
}
