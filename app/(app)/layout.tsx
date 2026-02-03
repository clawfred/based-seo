import { ApplicationShell } from "@/components/layout/application-shell";

// Disable static generation for app routes (Privy hooks need client context)
export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ApplicationShell>{children}</ApplicationShell>;
}
