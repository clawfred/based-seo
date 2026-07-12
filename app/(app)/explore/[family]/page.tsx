import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import type { ExplorerEntry } from "@/components/explore/family-explorer";
import { FamilyExplorer } from "@/components/explore/family-explorer";
import { quote } from "@/lib/registry/pricing";
import { fieldsFor } from "@/lib/registry/param-fields";
import { FAMILIES, endpointsInFamily, getFamily } from "@/lib/registry/taxonomy";

export function generateStaticParams() {
  return FAMILIES.map((f) => ({ family: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ family: string }> }) {
  const family = getFamily((await params).family);
  return family ? { title: family.label, description: family.blurb } : {};
}

export default async function FamilyPage({ params }: { params: Promise<{ family: string }> }) {
  const family = getFamily((await params).family);
  if (!family) notFound();

  const entries: ExplorerEntry[] = endpointsInFamily(family).map((endpoint) => ({
    endpoint,
    fields: fieldsFor(endpoint),
    priceUsd: quote(endpoint).usd,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Link
          href="/explore"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All families
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{family.label}</h1>
        <p className="text-muted-foreground">{family.blurb}</p>
      </div>

      <FamilyExplorer entries={entries} />
    </div>
  );
}
