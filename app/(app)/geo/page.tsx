"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  Bot,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Sparkles,
  Globe,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertBanner } from "@/components/shared/alert-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locations } from "@/lib/locations";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePreferences } from "@/hooks/use-preferences";

// Platform types and info
type Platform = "google_ai_overview" | "chatgpt" | "claude" | "perplexity";

interface PlatformInfo {
  id: Platform;
  name: string;
  icon: typeof Bot;
  available: boolean;
  color: string;
}

const PLATFORMS: PlatformInfo[] = [
  { id: "google_ai_overview", name: "Google AI Overview", icon: Globe, available: true, color: "text-blue-500" },
  { id: "chatgpt", name: "ChatGPT", icon: BrainCircuit, available: false, color: "text-green-500" },
  { id: "claude", name: "Claude", icon: Bot, available: false, color: "text-orange-500" },
  { id: "perplexity", name: "Perplexity", icon: Search, available: false, color: "text-purple-500" },
];

interface Source {
  url: string;
  title: string;
  domain: string;
}

interface PlatformResult {
  platform: Platform;
  platformName: string;
  available: boolean;
  aiResponse: string | null;
  brandMentioned: boolean;
  mentionContext: string | null;
  sources: Source[];
  error?: string;
}

interface GeoSearchResponse {
  query: string;
  brand: string;
  results: PlatformResult[];
  summary: {
    totalPlatforms: number;
    availablePlatforms: number;
    mentionedIn: number;
  };
}

const exampleQueries = [
  "best SEO tools for startups",
  "how to improve website ranking",
  "keyword research tools comparison",
];

export default function GeoTrackerPage() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["google_ai_overview"]);
  const [location, setLocation] = useState("2840"); // US by default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [results, setResults] = useState<GeoSearchResponse | null>(null);

  const { userId } = useCurrentUser();
  const { preferences, updatePreferences } = usePreferences(userId);

  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    updatePreferences({ defaultLocation: newLoc });
  };

  const togglePlatform = (platformId: Platform) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform?.available) return; // Can't select unavailable platforms

    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(p => p !== platformId);
      }
      return [...prev, platformId];
    });
  };

  const handleSearch = async () => {
    if (!query.trim() || !brand.trim()) {
      setError("Please enter both a search query and a brand name");
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError("Please select at least one platform to check");
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);
    setResults(null);

    try {
      const response = await fetch("/api/geo/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          brand: brand.trim(),
          platforms: selectedPlatforms,
          location_code: parseInt(location, 10),
          language_code: "en",
        }),
      });

      if (response.status === 402) {
        // Handle payment required
        const data = await response.json();
        setError(data.message || "Payment required. Please connect your wallet.");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to search AI platforms");
        return;
      }

      const data = await response.json();
      if (data.warning) {
        setWarning(data.warning);
      }
      setResults(data.data);
    } catch (err) {
      console.error("GEO search error:", err);
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="container mx-auto space-y-6 p-4 md:space-y-8 md:p-8">
      {/* Hero section */}
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">GEO Tracker</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            NEW
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Track your brand&apos;s visibility in AI-powered search results.
          <br />
          <span className="text-sm">
            The first affordable tool to see if AI recommends your brand.
          </span>
        </p>

        {/* Search form */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            {/* Query input */}
            <div className="space-y-2">
              <label htmlFor="query" className="text-sm font-medium text-left block">
                What would users ask about your topic?
              </label>
              <Input
                id="query"
                placeholder="e.g., best SEO tools for startups"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={loading}
                className="text-base"
              />
            </div>

            {/* Brand input */}
            <div className="space-y-2">
              <label htmlFor="brand" className="text-sm font-medium text-left block">
                Brand or domain to track
              </label>
              <Input
                id="brand"
                placeholder="e.g., Ahrefs, yourcompany.com"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={loading}
                className="text-base"
              />
            </div>

            {/* Platform selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-left block">
                Platforms to check
              </label>
              <div className="flex flex-wrap gap-3 justify-center">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <div
                      key={platform.id}
                      className={`flex items-center gap-2 rounded-lg border p-3 transition-colors cursor-pointer ${
                        platform.available
                          ? isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                          : "opacity-60 cursor-not-allowed"
                      }`}
                      onClick={() => togglePlatform(platform.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={!platform.available}
                        className="pointer-events-none"
                      />
                      <Icon className={`h-4 w-4 ${platform.color}`} />
                      <span className="text-sm font-medium">{platform.name}</span>
                      {!platform.available && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Clock className="h-3 w-3" />
                          Soon
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location and Search button */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex items-center gap-3">
                <Select value={location} onValueChange={handleLocationChange}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.code} value={String(loc.locationCode)}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSearch}
                  className="gap-2"
                  disabled={loading || !query.trim() || !brand.trim()}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Track Visibility
                </Button>
              </div>
              <p className={`text-xs text-muted-foreground ${!query.trim() || !brand.trim() ? "invisible" : ""}`}>
                Cost: $0.05 USDC per search
              </p>
            </div>

            {/* Example queries */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-sm text-muted-foreground">Try:</span>
              {exampleQueries.map((exampleQuery) => (
                <Badge
                  key={exampleQuery}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleExampleClick(exampleQuery)}
                >
                  {exampleQuery}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-auto max-w-3xl">
          <AlertBanner variant="error" message={error} />
        </div>
      )}
      {warning && (
        <div className="mx-auto max-w-3xl">
          <AlertBanner variant="warning" message={warning} />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mx-auto max-w-4xl space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Summary card */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Visibility Summary
              </CardTitle>
              <CardDescription>
                Results for &quot;{results.query}&quot; tracking &quot;{results.brand}&quot;
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {results.summary.mentionedIn}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of {results.summary.availablePlatforms} platforms mention your brand
                  </div>
                </div>
                {results.summary.mentionedIn > 0 ? (
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                ) : (
                  <XCircle className="h-12 w-12 text-red-500" />
                )}
              </div>
              {results.summary.mentionedIn === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Your brand wasn&apos;t found in AI responses. Consider improving your content authority and online presence.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Platform results */}
          <div className="grid gap-4 md:grid-cols-2">
            {results.results.map((result) => {
              const platformInfo = PLATFORMS.find(p => p.id === result.platform);
              const Icon = platformInfo?.icon || Bot;

              return (
                <Card
                  key={result.platform}
                  className={`transition-all ${
                    result.available
                      ? result.brandMentioned
                        ? "border-green-500/50 bg-green-500/5"
                        : ""
                      : "opacity-60"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className={`h-5 w-5 ${platformInfo?.color}`} />
                        {result.platformName}
                      </CardTitle>
                      {result.available ? (
                        result.brandMentioned ? (
                          <Badge className="bg-green-500 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Mentioned
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Not Mentioned
                          </Badge>
                        )
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!result.available ? (
                      <p className="text-sm text-muted-foreground italic">
                        This platform will be available in a future update.
                      </p>
                    ) : result.error ? (
                      <p className="text-sm text-red-500">{result.error}</p>
                    ) : result.aiResponse ? (
                      <>
                        {/* AI Response preview */}
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-sm line-clamp-4">
                            {result.aiResponse}
                          </p>
                        </div>

                        {/* Mention context */}
                        {result.brandMentioned && result.mentionContext && (
                          <div className="rounded-lg border-l-4 border-green-500 bg-green-500/10 p-3">
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">
                              Brand mention context:
                            </p>
                            <p className="text-sm italic">&quot;{result.mentionContext}&quot;</p>
                          </div>
                        )}

                        {/* Sources */}
                        {result.sources.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Sources cited ({result.sources.length}):
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {result.sources.slice(0, 5).map((source, idx) => (
                                <a
                                  key={idx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  {source.domain}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No AI response found for this query.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
