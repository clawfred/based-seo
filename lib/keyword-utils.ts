/**
 * Shared utility functions for keyword-related color coding and formatting.
 * Used across Overview, Finder, and Saved Keywords pages.
 */

const INTENT_COLORS: Record<string, string> = {
  Informational: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  Commercial: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400",
  Transactional: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
  Navigational: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400",
};

export function getKDColor(kd: number): string {
  if (kd < 33) return "text-green-600 dark:text-green-400";
  if (kd < 66) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export function getIntentColor(intent: string): string {
  return INTENT_COLORS[intent] || INTENT_COLORS.Informational;
}
