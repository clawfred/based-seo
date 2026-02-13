"use client";

import { useState } from "react";
import { Search, Loader2, Globe, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDomainAudit } from "@/hooks/use-domain-audit";
import type { AuditIssue } from "@/lib/api";

const severityConfig = {
  critical: { color: "bg-red-500", icon: XCircle, label: "Critical" },
  high: { color: "bg-orange-500", icon: AlertTriangle, label: "High" },
  medium: { color: "bg-yellow-500", icon: Info, label: "Medium" },
  low: { color: "bg-blue-500", icon: Info, label: "Low" },
};

function ScoreGauge({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-yellow-500";
    if (s >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Needs Work";
    return "Poor";
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`text-6xl font-bold ${getScoreColor(score)}`}>{score}</div>
      <div className="text-muted-foreground text-sm">{getScoreLabel(score)}</div>
    </div>
  );
}

function CategoryCard({
  name,
  score,
  issues,
}: {
  name: string;
  score: number;
  issues: string[];
}) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "bg-green-500";
    if (s >= 60) return "bg-yellow-500";
    if (s >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium capitalize">{name}</CardTitle>
          <Badge variant="secondary" className={`${getScoreColor(score)} text-white`}>
            {score}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={score} className="mb-2 h-2" />
        {issues.length > 0 ? (
          <ul className="text-muted-foreground space-y-1 text-xs">
            {issues.slice(0, 3).map((issue, i) => (
              <li key={i} className="flex items-start gap-1">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-yellow-500" />
                <span>{issue}</span>
              </li>
            ))}
            {issues.length > 3 && (
              <li className="text-muted-foreground">+{issues.length - 3} more issues</li>
            )}
          </ul>
        ) : (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>No issues found</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IssuesList({ issues }: { issues: AuditIssue[] }) {
  const groupedIssues = {
    critical: issues.filter((i) => i.severity === "critical"),
    high: issues.filter((i) => i.severity === "high"),
    medium: issues.filter((i) => i.severity === "medium"),
    low: issues.filter((i) => i.severity === "low"),
  };

  return (
    <div className="space-y-4">
      {(["critical", "high", "medium", "low"] as const).map((severity) => {
        const items = groupedIssues[severity];
        if (items.length === 0) return null;

        const config = severityConfig[severity];
        const Icon = config.icon;

        return (
          <div key={severity}>
            <h4 className="mb-2 flex items-center gap-2 font-medium">
              <Icon className={`h-4 w-4 ${severity === "critical" ? "text-red-500" : severity === "high" ? "text-orange-500" : severity === "medium" ? "text-yellow-500" : "text-blue-500"}`} />
              {config.label} ({items.length})
            </h4>
            <div className="space-y-2">
              {items.map((issue, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{issue.issue}</p>
                      <p className="text-muted-foreground text-sm">{issue.recommendation}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {issue.category}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AuditPage() {
  const { url, setUrl, loading, error, result, runAudit, reset } = useDomainAudit();
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setUrl(inputValue.trim());
      runAudit(inputValue.trim());
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-4 md:space-y-8 md:p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">Domain Audit</h1>
        <p className="text-muted-foreground">
          Comprehensive AI-powered SEO analysis for any website. Get actionable insights in seconds.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Enter domain (e.g., example.com)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !inputValue.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Run Audit
                </>
              )}
            </Button>
          </form>
          <p className="text-muted-foreground mt-2 text-xs">
            💰 $1.50 per audit • Paid with USDC on Base
          </p>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="flex items-center gap-2 pt-6 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="text-primary mb-4 h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Analyzing {inputValue}...</p>
            <p className="text-muted-foreground text-sm">This may take up to 30 seconds</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Score Overview */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Health Score</CardTitle>
              <CardDescription>{result.url}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <ScoreGauge score={result.score} />
                <div className="flex-1 space-y-4">
                  <p className="text-muted-foreground">{result.summary}</p>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    {Object.entries(result.categories).map(([name, category]) => (
                      <CategoryCard
                        key={name}
                        name={name}
                        score={category.score}
                        issues={category.issues}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Recommendations</CardTitle>
                <CardDescription>Priority actions to improve your SEO</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-inside list-decimal space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm">
                      {rec}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* All Issues */}
          <Card>
            <CardHeader>
              <CardTitle>All Issues ({result.issues.length})</CardTitle>
              <CardDescription>Detailed breakdown of detected issues</CardDescription>
            </CardHeader>
            <CardContent>
              <IssuesList issues={result.issues} />
            </CardContent>
          </Card>

          {/* Run Another */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={reset}>
              Run Another Audit
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !result && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-medium">Enter a domain to analyze</h3>
            <p className="text-muted-foreground text-sm">
              Get a comprehensive SEO audit with AI-powered analysis, including technical SEO,
              on-page optimization, content quality, and more.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
