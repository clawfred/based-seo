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

export interface FilterValues {
  volumeMin: string;
  volumeMax: string;
  kdMin: string;
  kdMax: string;
  intentFilter: string;
}

interface FinderFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
}

export function FinderFilters({ filters, onChange }: FinderFiltersProps) {
  function set(key: keyof FilterValues, value: string) {
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Intent</label>
            <Select value={filters.intentFilter} onValueChange={(v) => set("intentFilter", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Informational">Informational</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Transactional">Transactional</SelectItem>
                <SelectItem value="Navigational">Navigational</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
