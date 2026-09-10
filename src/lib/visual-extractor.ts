export function safeUnwrapJson(raw: unknown): unknown {
  if (!raw) return raw;
  let parsed = raw;
  while (typeof parsed === "string") {
    try {
      const next = JSON.parse(parsed);
      if (next === parsed) break;
      parsed = next;
    } catch {
      break;
    }
  }
  return parsed;
}

export function parseVisualData(raw: unknown): Record<string, any>[] {
  if (!raw) return [];
  const parsed = safeUnwrapJson(raw);

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

  // If raw was a string that wasn't JSON, attempt extracting table or list
  if (typeof raw === "string") {
    return extractTableFromMarkdown(raw) || extractRankedOrMetricList(raw) || [];
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
 * Extracts structured records from numbered ranked lists or metric bullet lists.
 * E.g., "1. Asad Malik (EMP156) - Engineering, Software Engineer II - Score: 94.68"
 * E.g., "1. **Asad Malik (EMP156)** - Engineering, Software Engineer II - Score 94.68, Exceptional"
 * E.g., "- **HR**: 45 employees"
 */
export function extractRankedOrMetricList(text: string): Record<string, any>[] | null {
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: Record<string, any>[] = [];

  // Pattern A: Numbered or bulleted employee ranking line
  const complexRankingRegex =
    /^(?:(\d+)[\.\)]|[-*•])\s*(?:\*\*)?([A-Za-z\s.'-]+?)(?:\*\*)?(?:\s*\(([A-Z0-9_-]+)\))?(?:\*\*)?\s*(?:[-–—:]\s*(.*?))?\s*[-–—:]\s*(?:Score|Rating|Performance|Value)?[:\s]*([$€£]?\s*[\d,]+(?:\.\d+)?%?)(?:[\s,]+(?:Band:?\s*)?\(?([A-Za-z\s]+)\)?)?$/i;

  for (const line of lines) {
    const m = line.match(complexRankingRegex);
    if (m) {
      const rank = m[1] ? Number(m[1]) : undefined;
      const rawName = m[2]?.trim().replace(/^\*\*|\*\*$/g, "");
      const empId = m[3]?.trim();
      const middleDetails = m[4]?.trim();
      const rawScore = m[5]?.trim().replace(/[$€£,%]/g, "");
      const band = m[6]?.trim().replace(/^\(|\)$/g, "");

      const scoreNum = Number(rawScore);
      if (rawName && !isNaN(scoreNum)) {
        const record: Record<string, any> = {};
        if (rank !== undefined) record["Rank"] = rank;
        record["Employee_Name"] = rawName;
        if (empId) record["Employee_ID"] = empId;
        if (middleDetails) {
          const parts = middleDetails.split(/[,–—]\s*/);
          if (parts.length >= 2) {
            record["Department"] = parts[0].trim();
            record["Position"] = parts.slice(1).join(", ").trim();
          } else if (parts.length === 1) {
            record["Department"] = parts[0].trim();
          }
        }
        record["Score"] = scoreNum;
        if (band && band.toLowerCase() !== "score") record["Performance_Band"] = band;
        items.push(record);
        continue;
      }
    }

    // Pattern B: Simple Key - Value line (e.g. "- **HR**: 45 employees" or "1. Engineering: 80")
    const simpleRegex =
      /^(?:(?:\d+)[\.\)]|[-*•])\s*(?:\*\*)?([A-Za-z0-9&/ ._-]+?)(?:\*\*)?\s*[:–—-]\s*(?:Score:?\s*)?([$€£]?\s*[\d,]+(?:\.\d+)?%?(?:\s+[A-Za-z]+)?)/i;
    const sm = line.match(simpleRegex);
    if (sm) {
      const label = sm[1].trim();
      const rawVal = sm[2].trim();
      const numMatch = rawVal.match(/[\d,]+(?:\.\d+)?/);
      if (numMatch && label.length > 0 && label.length < 60) {
        const num = Number(numMatch[0].replace(/,/g, ""));
        if (!isNaN(num)) {
          items.push({
            name: label,
            value: num,
          });
        }
      }
    }
  }

  return items.length >= 2 ? items : null;
}

/**
 * Common data structure analyzer that determines category key and metric keys.
 * Intelligently excludes identifiers like Rank, ID, EmpId from metric keys,
 * and prioritizes Employee_Name / Name as the primary category key.
 */
export function analyzeDataStructure(items: Record<string, any>[]): {
  categoryKey: string;
  metricKeys: string[];
  columns: string[];
} {
  if (items.length === 0) {
    return { categoryKey: "name", metricKeys: ["value"], columns: [] };
  }

  const columns = Object.keys(items[0]);

  // Preferred category key candidate: name > dept > category > string column
  const categoryKeyCandidate =
    columns.find((c) => /^(?:employee_?)?name|full_?name$/i.test(c)) ||
    columns.find((c) => /name|dept|department|category|label|role|title|month|date/i.test(c)) ||
    columns.find((c) => {
      const val = items[0][c];
      return typeof val === "string" && isNaN(Number(val));
    }) ||
    columns[0];

  // Metric keys: numeric columns excluding identifier / rank columns
  const metricKeys = columns.filter((c) => {
    if (c === categoryKeyCandidate) return false;
    if (/^(?:id|rank|index|#|_id)$/i.test(c) || /_id$/i.test(c)) return false;
    const val = items[0][c];
    return typeof val === "number" || (typeof val === "string" && !isNaN(Number(val)) && val.trim() !== "");
  });

  return {
    categoryKey: categoryKeyCandidate,
    metricKeys: metricKeys.length > 0 ? metricKeys : columns.filter((c) => c !== categoryKeyCandidate),
    columns,
  };
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
        : parsedExisting.length > 10
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

  // 3. Check if the response reply contains a ranked employee list or metric list
  const listData = extractRankedOrMetricList(reply);
  if (listData && listData.length >= 2) {
    const hasRank = listData.some((item) => "Rank" in item || "Score" in item);
    return {
      visualization: true,
      chartType: (existingType as any) || "bar",
      chartData: listData,
      visualizationReason:
        existingReason || (hasRank ? "Top Performers Ranking" : "Workforce Breakdown"),
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
