"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface GapFilterValues {
  volumeMin: string;
  volumeMax: string;
  kdMin: string;
  kdMax: string;
}

interface GapFiltersProps {
  filters: GapFilterValues;
  onChange: (filters: GapFilterValues) => void;
}

export function GapFilters({ filters, onChange }: GapFiltersProps) {
  function set(key: keyof GapFilterValues, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Min Volume</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.volumeMin}
              onChange={(e) => set("volumeMin", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Volume</label>
            <Input
              type="number"
              placeholder="1000000"
              value={filters.volumeMax}
              onChange={(e) => set("volumeMax", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Min KD</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.kdMin}
              onChange={(e) => set("kdMin", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max KD</label>
            <Input
              type="number"
              placeholder="100"
              value={filters.kdMax}
              onChange={(e) => set("kdMax", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
