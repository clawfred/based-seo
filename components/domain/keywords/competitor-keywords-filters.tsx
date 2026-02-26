"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CompetitorFilters {
  positionRange: string;
  volumeMin: string;
  volumeMax: string;
  kdMin: string;
  kdMax: string;
}

interface CompetitorKeywordsFiltersProps {
  filters: CompetitorFilters;
  onChange: (filters: CompetitorFilters) => void;
}

export function CompetitorKeywordsFilters({
  filters,
  onChange,
}: CompetitorKeywordsFiltersProps) {
  function set(key: keyof CompetitorFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Position Range</label>
            <Select
              value={filters.positionRange}
              onValueChange={(v) => set("positionRange", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="1-10">Top 10 (1-10)</SelectItem>
                <SelectItem value="11-20">Page 2 (11-20)</SelectItem>
                <SelectItem value="21-50">21-50</SelectItem>
                <SelectItem value="51-100">51-100</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
