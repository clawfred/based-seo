import {
  BarChart3,
  FileText,
  Gauge,
  Globe,
  Link2,
  ListOrdered,
  PenLine,
  Search,
  Smartphone,
  Sparkles,
  Store,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

/**
 * Resolves the icon names carried by the registry taxonomy to Lucide
 * components. The taxonomy stays a string-only server module; the mapping to
 * React components lives here, in the client layer.
 */
const ICONS: Record<string, LucideIcon> = {
  Search,
  Link2,
  Gauge,
  ListOrdered,
  Sparkles,
  BarChart3,
  Globe,
  FileText,
  ShoppingCart,
  Store,
  Smartphone,
  PenLine,
};

export function navIcon(name: string): LucideIcon {
  return ICONS[name] ?? Search;
}
