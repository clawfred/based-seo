import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface VolumeBreakdownProps {
  globalVolume: { country: string; volume: number }[];
  primaryVolume: number;
}

export function VolumeBreakdown({ globalVolume, primaryVolume }: VolumeBreakdownProps) {
  if (globalVolume.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume Breakdown</CardTitle>
        <CardDescription>Search volume by location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {globalVolume.map((gv) => (
          <div key={gv.country} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{gv.country}</span>
              <span className="text-muted-foreground">{gv.volume.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-indigo-600"
                style={{
                  width: `${Math.min((gv.volume / Math.max(primaryVolume, 1)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
