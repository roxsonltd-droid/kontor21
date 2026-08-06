const DECIMAL_STRING = /^[0-9]+(?:\.[0-9]+)?$/;

/**
 * Accepts a non-negative decimal amount as a string (or number) and returns a
 * canonical decimal string suitable for Prisma Decimal columns. Rejects values
 * that would lose precision or cannot be represented safely.
 */
export function parseDecimalString(
  value: unknown,
  field: string
): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${field} must be a non-negative decimal string`);
    }
    return String(value);
  }
  if (typeof value !== "string" || !DECIMAL_STRING.test(value)) {
    throw new Error(`${field} must be a non-negative decimal string`);
  }
  return value;
}

/**
 * Validates a positive (non-zero) decimal string and returns the canonical
 * form. Throws when the value is zero, negative, or not a valid decimal.
 */
export function parsePositiveDecimalString(
  value: unknown,
  field: string
): string {
  const parsed = parseDecimalString(value, field);
  if (parseDecimalStringIsZero(parsed)) {
    throw new Error(`${field} must be greater than zero`);
  }
  return parsed;
}

function parseDecimalStringIsZero(value: string): boolean {
  const [whole = "0", frac = ""] = value.split(".");
  const significant = (whole.replace(/^0+/, "") + frac.replace(/0+$/, "")).replace(/^0+$/, "");
  return significant === "";
}
