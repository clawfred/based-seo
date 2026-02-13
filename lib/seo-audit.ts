import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";

export interface PageData {
  url: string;
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  h3: string[];
  canonicalUrl: string | null;
  ogTags: Record<string, string>;
  schemaMarkup: string[];
  images: { src: string; alt: string; hasAlt: boolean }[];
  links: { href: string; text: string; isExternal: boolean }[];
  wordCount: number;
  robots: string | null;
  viewport: string | null;
  charset: string | null;
  lang: string | null;
  loadTimeMs?: number;
}

export interface AuditResult {
  url: string;
  score: number;
  categories: {
    technical: CategoryScore;
    onPage: CategoryScore;
    content: CategoryScore;
    schema: CategoryScore;
    images: CategoryScore;
  };
  issues: AuditIssue[];
  recommendations: string[];
  summary: string;
}

export interface CategoryScore {
  score: number;
  issues: string[];
  passed: string[];
}

export interface AuditIssue {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  issue: string;
  recommendation: string;
}

export async function fetchPage(url: string): Promise<{ html: string; loadTimeMs: number }> {
  const start = Date.now();
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BasedSEOBot/1.0; +https://based-seo.com/bot)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const loadTimeMs = Date.now() - start;

  return { html, loadTimeMs };
}

export function parsePageData(url: string, html: string, loadTimeMs?: number): PageData {
  const $ = cheerio.load(html);

  // Extract title
  const title = $("title").first().text().trim();

  // Extract meta description
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";

  // Extract headings
  const h1 = $("h1")
    .map((_, el) => $(el).text().trim())
    .get();
  const h2 = $("h2")
    .map((_, el) => $(el).text().trim())
    .get();
  const h3 = $("h3")
    .map((_, el) => $(el).text().trim())
    .get();

  // Extract canonical
  const canonicalUrl = $('link[rel="canonical"]').attr("href") || null;

  // Extract OG tags
  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr("property")?.replace("og:", "") || "";
    const content = $(el).attr("content") || "";
    if (property) ogTags[property] = content;
  });

  // Extract schema markup
  const schemaMarkup = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).html() || "")
    .get()
    .filter(Boolean);

  // Extract images
  const images = $("img")
    .map((_, el) => ({
      src: $(el).attr("src") || "",
      alt: $(el).attr("alt") || "",
      hasAlt: $(el).attr("alt") !== undefined,
    }))
    .get();

  // Extract links
  const baseUrl = new URL(url);
  const links = $("a[href]")
    .map((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();
      let isExternal = false;
      try {
        const linkUrl = new URL(href, url);
        isExternal = linkUrl.hostname !== baseUrl.hostname;
      } catch {
        isExternal = false;
      }
      return { href, text, isExternal };
    })
    .get();

  // Word count (rough estimate from body text)
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.split(/\s+/).length;

  // Other meta
  const robots = $('meta[name="robots"]').attr("content") || null;
  const viewport = $('meta[name="viewport"]').attr("content") || null;
  const charset =
    $("meta[charset]").attr("charset") ||
    $('meta[http-equiv="Content-Type"]').attr("content")?.match(/charset=([^;]+)/)?.[1] ||
    null;
  const lang = $("html").attr("lang") || null;

  return {
    url,
    title,
    metaDescription,
    h1,
    h2,
    h3,
    canonicalUrl,
    ogTags,
    schemaMarkup,
    images,
    links,
    wordCount,
    robots,
    viewport,
    charset,
    lang,
    loadTimeMs,
  };
}

export function performBasicAudit(pageData: PageData): Partial<AuditResult> {
  const issues: AuditIssue[] = [];

  // Technical checks
  if (!pageData.viewport) {
    issues.push({
      severity: "high",
      category: "technical",
      issue: "Missing viewport meta tag",
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
    });
  }

  if (!pageData.charset) {
    issues.push({
      severity: "medium",
      category: "technical",
      issue: "Missing charset declaration",
      recommendation: 'Add <meta charset="UTF-8"> in the <head>',
    });
  }

  if (!pageData.lang) {
    issues.push({
      severity: "medium",
      category: "technical",
      issue: "Missing lang attribute on <html>",
      recommendation: 'Add lang attribute: <html lang="en">',
    });
  }

  if (!pageData.canonicalUrl) {
    issues.push({
      severity: "medium",
      category: "technical",
      issue: "Missing canonical URL",
      recommendation: "Add a canonical link to prevent duplicate content issues",
    });
  }

  // On-page checks
  if (!pageData.title) {
    issues.push({
      severity: "critical",
      category: "onPage",
      issue: "Missing page title",
      recommendation: "Add a descriptive <title> tag (50-60 characters recommended)",
    });
  } else if (pageData.title.length < 30) {
    issues.push({
      severity: "medium",
      category: "onPage",
      issue: `Title too short (${pageData.title.length} chars)`,
      recommendation: "Expand title to 50-60 characters for better SEO",
    });
  } else if (pageData.title.length > 60) {
    issues.push({
      severity: "low",
      category: "onPage",
      issue: `Title too long (${pageData.title.length} chars)`,
      recommendation: "Shorten title to under 60 characters to avoid truncation in SERPs",
    });
  }

  if (!pageData.metaDescription) {
    issues.push({
      severity: "high",
      category: "onPage",
      issue: "Missing meta description",
      recommendation: "Add a compelling meta description (150-160 characters)",
    });
  } else if (pageData.metaDescription.length < 120) {
    issues.push({
      severity: "low",
      category: "onPage",
      issue: `Meta description too short (${pageData.metaDescription.length} chars)`,
      recommendation: "Expand meta description to 150-160 characters",
    });
  } else if (pageData.metaDescription.length > 160) {
    issues.push({
      severity: "low",
      category: "onPage",
      issue: `Meta description too long (${pageData.metaDescription.length} chars)`,
      recommendation: "Shorten meta description to under 160 characters",
    });
  }

  if (pageData.h1.length === 0) {
    issues.push({
      severity: "high",
      category: "onPage",
      issue: "Missing H1 heading",
      recommendation: "Add a single, descriptive H1 heading to the page",
    });
  } else if (pageData.h1.length > 1) {
    issues.push({
      severity: "medium",
      category: "onPage",
      issue: `Multiple H1 headings (${pageData.h1.length})`,
      recommendation: "Use only one H1 per page for clear hierarchy",
    });
  }

  // Content checks
  if (pageData.wordCount < 300) {
    issues.push({
      severity: "high",
      category: "content",
      issue: `Thin content (${pageData.wordCount} words)`,
      recommendation: "Add more substantive content (aim for 500+ words for informational pages)",
    });
  }

  // Schema checks
  if (pageData.schemaMarkup.length === 0) {
    issues.push({
      severity: "medium",
      category: "schema",
      issue: "No structured data found",
      recommendation: "Add JSON-LD schema markup (Organization, WebPage, Article, etc.)",
    });
  }

  // OG tags
  if (!pageData.ogTags.title) {
    issues.push({
      severity: "low",
      category: "onPage",
      issue: "Missing Open Graph title",
      recommendation: "Add og:title for better social sharing",
    });
  }
  if (!pageData.ogTags.image) {
    issues.push({
      severity: "low",
      category: "onPage",
      issue: "Missing Open Graph image",
      recommendation: "Add og:image for social sharing previews",
    });
  }

  // Image checks
  const imagesWithoutAlt = pageData.images.filter((img) => !img.hasAlt);
  if (imagesWithoutAlt.length > 0) {
    issues.push({
      severity: "medium",
      category: "images",
      issue: `${imagesWithoutAlt.length} images missing alt text`,
      recommendation: "Add descriptive alt text to all images for accessibility and SEO",
    });
  }

  return { issues };
}

export async function performAIAnalysis(
  pageData: PageData,
  basicIssues: AuditIssue[],
): Promise<AuditResult> {
  const anthropic = new Anthropic();

  const prompt = `You are an expert SEO analyst. Analyze this webpage data and provide a comprehensive SEO audit.

## Page Data
URL: ${pageData.url}
Title: ${pageData.title || "(missing)"}
Meta Description: ${pageData.metaDescription || "(missing)"}
H1 Tags: ${pageData.h1.join(", ") || "(none)"}
H2 Tags: ${pageData.h2.slice(0, 5).join(", ")}${pageData.h2.length > 5 ? ` (+${pageData.h2.length - 5} more)` : ""}
Word Count: ${pageData.wordCount}
Load Time: ${pageData.loadTimeMs}ms
Language: ${pageData.lang || "(not set)"}
Canonical: ${pageData.canonicalUrl || "(not set)"}
Schema Types: ${pageData.schemaMarkup.length > 0 ? pageData.schemaMarkup.map((s) => { try { return JSON.parse(s)["@type"]; } catch { return "unknown"; } }).join(", ") : "(none)"}
Images: ${pageData.images.length} total, ${pageData.images.filter((i) => !i.hasAlt).length} missing alt
Internal Links: ${pageData.links.filter((l) => !l.isExternal).length}
External Links: ${pageData.links.filter((l) => l.isExternal).length}
OG Tags: ${Object.keys(pageData.ogTags).join(", ") || "(none)"}

## Already Identified Issues
${basicIssues.map((i) => `- [${i.severity.toUpperCase()}] ${i.issue}`).join("\n")}

## Your Task
Provide a JSON response with:
1. An overall SEO score (0-100)
2. Category scores for: technical, onPage, content, schema, images
3. A brief summary (2-3 sentences)
4. Top 5 prioritized recommendations

Respond ONLY with valid JSON in this format:
{
  "score": 75,
  "categories": {
    "technical": { "score": 80, "notes": "..." },
    "onPage": { "score": 70, "notes": "..." },
    "content": { "score": 75, "notes": "..." },
    "schema": { "score": 60, "notes": "..." },
    "images": { "score": 85, "notes": "..." }
  },
  "summary": "...",
  "recommendations": ["...", "...", "...", "...", "..."]
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from AI");
  }

  let aiResult: {
    score: number;
    categories: Record<string, { score: number; notes: string }>;
    summary: string;
    recommendations: string[];
  };

  try {
    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    aiResult = JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error("Failed to parse AI response:", textContent.text);
    throw new Error("Failed to parse AI analysis");
  }

  return {
    url: pageData.url,
    score: aiResult.score,
    categories: {
      technical: {
        score: aiResult.categories.technical?.score || 0,
        issues: basicIssues.filter((i) => i.category === "technical").map((i) => i.issue),
        passed: [],
      },
      onPage: {
        score: aiResult.categories.onPage?.score || 0,
        issues: basicIssues.filter((i) => i.category === "onPage").map((i) => i.issue),
        passed: [],
      },
      content: {
        score: aiResult.categories.content?.score || 0,
        issues: basicIssues.filter((i) => i.category === "content").map((i) => i.issue),
        passed: [],
      },
      schema: {
        score: aiResult.categories.schema?.score || 0,
        issues: basicIssues.filter((i) => i.category === "schema").map((i) => i.issue),
        passed: [],
      },
      images: {
        score: aiResult.categories.images?.score || 0,
        issues: basicIssues.filter((i) => i.category === "images").map((i) => i.issue),
        passed: [],
      },
    },
    issues: basicIssues,
    recommendations: aiResult.recommendations || [],
    summary: aiResult.summary || "",
  };
}

export async function runFullAudit(url: string): Promise<AuditResult> {
  // Normalize URL
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  // Fetch page
  const { html, loadTimeMs } = await fetchPage(url);

  // Parse page data
  const pageData = parsePageData(url, html, loadTimeMs);

  // Run basic checks
  const basicAudit = performBasicAudit(pageData);
  const basicIssues = basicAudit.issues || [];

  // Run AI analysis
  const result = await performAIAnalysis(pageData, basicIssues);

  return result;
}
