// Nexus Core: document extraction helpers.
// Pure text parsing isolates the OCR/metadata extraction logic so it can be
// unit-tested without a DB connection; the evidence route feeds the OCR text
// or document metadata into these helpers to auto-fill verified values.

export interface ExtractedField {
  parameter: string;
  value: string;
  unit?: string;
}

export interface ExtractionMeta {
  method: "OCR_AUTO" | "MANUAL";
  parameter: string;
  matchedText?: string;
}

/**
 * Normalizes a raw extracted number so it can be compared against the stored
 * rule value: comma decimals become dots and thousands separators are removed
 * ("4,8" -> "4.8", "50 000" -> "50000", "50,000" -> "50000").
 */
export function normalizeExtractedValue(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{1,3}(,\d{3})+$/.test(trimmed)) {
    return trimmed.replace(/,/g, "");
  }
  if (/^\d+,\d+$/.test(trimmed)) {
    return trimmed.replace(",", ".");
  }
  const cleaned = trimmed.replace(/[_\u00a0\s]/g, "");
  if (/^\d+\.\d+$/.test(cleaned) || /^\d+$/.test(cleaned)) return cleaned;
  return trimmed;
}

/**
 * Extracts the value for a given parameter from OCR text or document metadata.
 * Recognizes numeric values with optional units ("Moisture: 8.0 %") and, when
 * no number is present, falls back to the remainder of the line as a free-text
 * value (useful for EQ conditions such as location).
 *
 * Returns null when the parameter is not found or nothing follows it.
 */
export function extractFieldValue(text: string, parameter: string): ExtractedField | null {
  if (!text || !parameter) return null;
  const needle = parameter.trim().toLowerCase();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const idx = line.toLowerCase().indexOf(needle);
    if (idx === -1) continue;
    // "moisture 8.0%" matches; "my moisture" only when word-bounded
    const before = idx > 0 ? line[idx - 1] : "";
    const after = idx + needle.length < line.length ? line[idx + needle.length] : "";
    if (before && /[a-z0-9]/i.test(before)) continue;
    if (after && /[a-z0-9]/i.test(after)) continue;
    const rest = line.slice(idx + needle.length).replace(/^[\s:=\-–—>]+/, "");
    if (!rest) continue;
    const numeric = rest.match(/^(\d[\d.,\s\u00a0]*)\s*([a-zA-Zµ°%‰]*)/);
    if (numeric) {
      const rawNumber = numeric[1].trim();
      const unit = numeric[2]?.trim() || undefined;
      const value = normalizeExtractedValue(rawNumber);
      if (value) {
        return { parameter: parameter.trim(), value, ...(unit ? { unit } : {}) };
      }
    }
    return { parameter: parameter.trim(), value: rest.split(/\s{2,}|\t/)[0].trim() };
  }
  return null;
}

/**
 * Extracts values for every parameter of interest from the given text. The
 * first match per parameter wins; parameters not found are skipped.
 */
export function extractAllFields(text: string, parameters: string[]): ExtractedField[] {
  const result: ExtractedField[] = [];
  const seen = new Set<string>();
  for (const parameter of parameters) {
    const key = parameter.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const field = extractFieldValue(text, parameter);
    if (field) result.push(field);
  }
  return result;
}

/**
 * Merges a manually supplied verified value with an OCR-derived one, preferring
 * an explicit manual value and recording how the value was obtained.
 */
export function extractionMetaFor(
  parameter: string,
  manualValue: string | undefined,
  matchedText: string | undefined,
): ExtractionMeta {
  if (manualValue && manualValue.trim()) {
    return { method: "MANUAL", parameter, matchedText: matchedText?.trim() || undefined };
  }
  return { method: "OCR_AUTO", parameter, matchedText: matchedText?.trim() || undefined };
}
