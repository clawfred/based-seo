import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Loading state for a single AI response: an avatar row plus lines of text. */
export function AskSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Card>
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
