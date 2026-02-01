import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  variant: "warning" | "error";
  message: string;
}

export function AlertBanner({ variant, message }: AlertBannerProps) {
  if (variant === "warning") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <p className="text-sm text-yellow-700 dark:text-yellow-400">{message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
      <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
    </div>
  );
}
