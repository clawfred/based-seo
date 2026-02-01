// Server-side DataForSEO helper — only import in API routes / server code

const DATAFORSEO_USERNAME = process.env.DATAFORSEO_USERNAME;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

export function hasCredentials(): boolean {
  return !!(DATAFORSEO_USERNAME && DATAFORSEO_PASSWORD);
}

function getAuthHeader(): string {
  if (!DATAFORSEO_USERNAME || !DATAFORSEO_PASSWORD) {
    throw new Error("DataForSEO credentials not configured");
  }
  return "Basic " + Buffer.from(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`).toString("base64");
}

export async function dataforseoFetch(
  url: string,
  body: unknown[],
): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DataForSEO API error ${response.status}: ${text}`);
  }

  return response.json();
}
