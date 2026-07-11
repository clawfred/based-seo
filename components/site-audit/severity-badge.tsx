import { Badge } from "@/components/ui/badge";
import type { Severity } from "./checks-catalog";

const STYLES: Record<Severity, string> = {
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-500",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  notice: "border-sky-500/30 bg-sky-500/10 text-sky-500",
};

const LABELS: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
  notice: "Notice",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant="outline" className={STYLES[severity]}>
      {LABELS[severity]}
    </Badge>
  );
}
