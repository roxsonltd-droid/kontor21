import { ConditionOperator } from "@prisma/client";

/**
 * Normalizes a number string by handling both comma and dot decimal separators,
 * and ignoring thousands separators.
 */
function parseNumericValue(value: string): number | null {
  if (value === null || value === undefined) return null;
  // Remove any spaces
  let normalized = value.toString().trim().replace(/\s/g, '');
  
  // If the string contains both a comma and a dot, assume the last one is the decimal separator
  const lastDot = normalized.lastIndexOf('.');
  const lastComma = normalized.lastIndexOf(',');
  
  if (lastDot > -1 && lastComma > -1) {
    if (lastDot > lastComma) {
      // 1,234.56
      normalized = normalized.replace(/,/g, '');
    } else {
      // 1.234,56
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    }
  } else if (lastComma > -1) {
    // 1234,56
    normalized = normalized.replace(',', '.');
  }

  const num = Number(normalized);
  return isNaN(num) ? null : num;
}

/**
 * Evaluates a verified value extracted from evidence against a contract condition.
 * 
 * @param verifiedValue The value extracted from the document
 * @param requiredValue The value required by the contract
 * @param operator The comparison operator (LTE, GTE, EQ, etc.)
 * @returns true if the condition is satisfied, false otherwise
 */
export function evaluateCondition(
  verifiedValue: string | null | undefined,
  requiredValue: string,
  operator: ConditionOperator
): boolean {
  if (verifiedValue == null || verifiedValue === '') return false;

  const numVerified = parseNumericValue(verifiedValue);
  const numRequired = parseNumericValue(requiredValue);

  // If both can be parsed as numbers, do mathematical comparison
  if (numVerified !== null && numRequired !== null) {
    switch (operator) {
      case "LTE": return numVerified <= numRequired;
      case "GTE": return numVerified >= numRequired;
      case "LT": return numVerified < numRequired;
      case "GT": return numVerified > numRequired;
      case "EQ": return numVerified === numRequired;
      default: return false;
    }
  }

  // Fallback to string comparison for non-numeric fields
  const strVerified = verifiedValue.toString().trim().toLowerCase();
  const strRequired = requiredValue.toString().trim().toLowerCase();

  switch (operator) {
    case "EQ": return strVerified === strRequired;
    // For string comparisons other than EQ, we fallback to exact match or return false
    default: return false;
  }
}
