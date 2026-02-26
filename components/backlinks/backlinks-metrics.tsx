"use client";

import { Link2, Globe, Award, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface BacklinksMetricsData {
  totalBacklinks: number;
  referringDomains: number;
  domainRank: number;
  dofollowRatio: number;
  newLinks30d: number;
  lostLinks30d: number;
}

interface BacklinksMetricsProps {
  data: BacklinksMetricsData;
}

export function BacklinksMetrics({ data }: BacklinksMetricsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
          <Link2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalBacklinks.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Links pointing to domain</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Referring Domains</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.referringDomains.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Unique linking domains</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Domain Rank</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.domainRank}</div>
          <p className="text-xs text-muted-foreground">DataForSEO rank (0-100)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dofollow %</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(data.dofollowRatio * 100)}%</div>
          <p className="text-xs text-muted-foreground">Links passing authority</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Links (30d)</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">+{data.newLinks30d.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Acquired last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lost Links (30d)</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">-{data.lostLinks30d.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Lost last 30 days</p>
        </CardContent>
      </Card>
    </div>
  );
}
