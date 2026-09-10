export function parseVisualData(raw: unknown): Record<string, any>[] {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Not valid JSON, try extracting if it's markdown
      return extractTableFromMarkdown(raw) || extractListMetricsFromMarkdown(raw) || [];
    }
  }
  if (Array.isArray(parsed)) {
    return parsed.filter(
      (item): item is Record<string, any> => item != null && typeof item === "object",
    );
  }
  if (typeof parsed === "object" && parsed !== null) {
    const record = parsed as Record<string, any>;
    for (const key of ["data", "items", "rows", "records", "results", "chart_data"]) {
      if (Array.isArray(record[key])) {
        return record[key].filter(
          (item): item is Record<string, any> => item != null && typeof item === "object",
        );
      }
    }
    const entries = Object.entries(record).filter(
      ([, v]) => typeof v === "number" || typeof v === "string",
    );
    if (entries.length > 0) {
      return entries.map(([name, value]) => ({
        name,
        value: typeof value === "number" ? value : Number(value) || value,
      }));
    }
  }
  return [];
}

/**
 * Extracts a structured array of objects from markdown tables in text.
 */
export function extractTableFromMarkdown(text: string): Record<string, any>[] | null {
  if (!text || !text.includes("|")) return null;
  const rawLines = text.split(/\r?\n/).map((l) => l.trim());
  const tableLines = rawLines.filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (tableLines.length < 3) return null; // Needs header, divider, and at least 1 data row

  // Parse header
  const headers = tableLines[0]
    .split("|")
    .slice(1, -1)
    .map((s) => s.trim().replace(/^\*\*|\*\*$/g, "").replace(/^\*|\*$/g, ""));

  if (headers.length < 2) return null;

  // Check divider line (e.g. |---|---| or |:---|---:|)
  const isDivider = /^\|(\s*:?-+:?\s*\|)+$/.test(tableLines[1]);
  if (!isDivider) return null;

  const rows: Record<string, any>[] = [];

  for (let i = 2; i < tableLines.length; i++) {
    const line = tableLines[i];
    if (/^\|(\s*:?-+:?\s*\|)+$/.test(line)) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((s) => s.trim().replace(/^\*\*|\*\*$/g, "").replace(/^\*|\*$/g, ""));

    if (cells.length === headers.length) {
      // Exclude footer summary "Total" / "Sum" rows
      const firstCellLower = cells[0].toLowerCase();
      if (
        (firstCellLower === "total" || firstCellLower === "sum" || firstCellLower.startsWith("total:")) &&
        i >= tableLines.length - 2
      ) {
        continue;
      }

      const row: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const val = cells[idx];
        const cleanedVal = val.replace(/[$€£,]/g, "").trim();
        const num = Number(cleanedVal.replace(/%$/, ""));
        row[h] = !isNaN(num) && cleanedVal !== "" ? num : val;
      });
      rows.push(row);
    }
  }

  return rows.length > 0 ? rows : null;
}

/**
 * Extracts key-metric pairs from formatted bulleted lists (e.g., "- **HR**: 45 employees").
 */
export function extractListMetricsFromMarkdown(text: string): Record<string, any>[] | null {
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const items: Record<string, any>[] = [];

  // Match: - **Category**: 45 employees or - Category: $50,000
  const regex = /^[-*•]\s*(?:\*\*)?([A-Za-z0-9&/ ._-]+?)(?:\*\*)?\s*[:–—-]\s*([$€£]?\s*[\d,]+(?:\.\d+)?%?(?:\s+[A-Za-z]+)?)/;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const label = match[1].trim();
      const rawVal = match[2].trim();
      // Extract numeric portion
      const numMatch = rawVal.match(/[\d,]+(?:\.\d+)?/);
      if (numMatch && label.length > 0 && label.length < 50) {
        const num = Number(numMatch[0].replace(/,/g, ""));
        if (!isNaN(num)) {
          items.push({
            department: label,
            count: num,
          });
        }
      }
    }
  }

  return items.length >= 3 ? items : null;
}

/**
 * Robust master extractor that returns visual metadata from either the backend fields
 * or parsed from the reply text, guaranteeing that visual data is visualized whenever present.
 */
export function extractVisualDataFromResponse(
  reply: string,
  existingData: unknown,
  existingType?: string | null,
  existingReason?: string | null,
): {
  visualization: boolean;
  chartType: "bar" | "line" | "pie" | "table" | "area" | null;
  chartData: Record<string, any>[] | null;
  visualizationReason: string | null;
} {
  // 1. Check if backend provided structured chart_data
  const parsedExisting = parseVisualData(existingData);
  if (parsedExisting.length > 0) {
    const rawType = (existingType || "").toLowerCase();
    const resolvedType =
      rawType === "pie" || rawType === "line" || rawType === "area" || rawType === "table" || rawType === "bar"
        ? (rawType as "bar" | "line" | "pie" | "table" | "area")
        : parsedExisting.length > 8
          ? "table"
          : "bar";

    return {
      visualization: true,
      chartType: resolvedType,
      chartData: parsedExisting,
      visualizationReason: existingReason || "Data Visualization",
    };
  }

  // 2. Check if the response reply contains a markdown table
  const tableData = extractTableFromMarkdown(reply);
  if (tableData && tableData.length >= 2) {
    const cols = Object.keys(tableData[0]);
    const rawType = (existingType || "").toLowerCase();
    const resolvedType =
      rawType === "bar" || rawType === "line" || rawType === "pie"
        ? (rawType as "bar" | "line" | "pie")
        : cols.length === 2 && tableData.length <= 10
          ? "bar"
          : "table";

    return {
      visualization: true,
      chartType: resolvedType,
      chartData: tableData,
      visualizationReason: existingReason || "Tabular Breakdown",
    };
  }

  // 3. Check if the response reply contains a structured list of metrics
  const listData = extractListMetricsFromMarkdown(reply);
  if (listData && listData.length >= 3) {
    return {
      visualization: true,
      chartType: (existingType as any) || "bar",
      chartData: listData,
      visualizationReason: existingReason || "Workforce Breakdown",
    };
  }

  // 4. No structured data could be extracted
  return {
    visualization: false,
    chartType: null,
    chartData: null,
    visualizationReason: null,
  };
}
