export function toCsvValue(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  // Escape double quotes by doubling them.
  const escaped = s.replace(/"/g, '""');
  // Wrap in quotes if needed.
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function toCsv(rows: Array<Record<string, unknown>>, headers: string[]): string {
  const lines: string[] = [];
  lines.push(headers.map((h) => toCsvValue(h)).join(","));
  for (const row of rows) {
    lines.push(headers.map((h) => toCsvValue(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

export function downloadTextFile(opts: { filename: string; content: string; mimeType?: string }) {
  const blob = new Blob([opts.content], { type: opts.mimeType ?? "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
