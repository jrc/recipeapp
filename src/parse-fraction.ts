/**
 * parse-fraction.ts
 * Handles parsing of fractions, mixed numbers, and decimal values from text.
 */

// Predefined Unicode fractions with their decimal equivalents
const UNICODE_FRACTIONS = new Map<string, number>([
  ["¼", 0.25],
  ["½", 0.5],
  ["¾", 0.75],
  ["⅐", 1 / 7],
  ["⅑", 1 / 9],
  ["⅒", 0.1],
  ["⅓", 1 / 3],
  ["⅔", 2 / 3],
  ["⅕", 0.2],
  ["⅖", 0.4],
  ["⅗", 0.6],
  ["⅘", 0.8],
  ["⅙", 1 / 6],
  ["⅚", 5 / 6],
  ["⅛", 0.125],
  ["⅜", 0.375],
  ["⅝", 0.625],
  ["⅞", 0.875],
]);

/**
 * Parses a fraction, mixed number, or decimal value to its numeric equivalent.
 *
 * @param text String containing a number in various formats
 * @returns Numeric value as a number
 * @throws Error for invalid inputs or division by zero
 *
 * @example
 * parseFraction("½") // Returns 0.5
 * parseFraction("1½") // Returns 1.5
 * parseFraction("1 1/2") // Returns 1.5
 * parseFraction("1/2") // Returns 0.5
 * parseFraction("1.5") // Returns 1.5
 */
export function parseFraction(text: string): number {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid input: text must be a non-empty string");
  }

  // Normalize whitespace
  const normalized = text.trim().replace(/\s+/g, " ");

  if (!normalized) {
    throw new Error("Invalid input: empty string");
  }

  // Check for Unicode fractions first
  for (const [fraction, value] of UNICODE_FRACTIONS) {
    if (normalized.includes(fraction)) {
      // Handle mixed numbers with Unicode fractions (e.g., "1½")
      const mixedMatch = normalized.match(
        new RegExp(`^(\\d+)\\s*${escapeRegExp(fraction)}$`),
      );
      if (mixedMatch) {
        const whole = parseInt(mixedMatch[1], 10);
        return whole + value;
      }

      // Pure Unicode fraction
      if (normalized === fraction) {
        return value;
      }
    }
  }

  // Handle mixed numbers with regular fractions (e.g., "1 1/2")
  const mixedMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const numerator = parseInt(mixedMatch[2], 10);
    const denominator = parseInt(mixedMatch[3], 10);

    if (denominator === 0) {
      throw new Error("Division by zero in fraction");
    }

    return whole + numerator / denominator;
  }

  // Handle simple fractions (e.g., "1/2")
  const fractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);

    if (denominator === 0) {
      throw new Error("Division by zero in fraction");
    }

    return numerator / denominator;
  }

  // Handle decimal numbers
  const decimalMatch = normalized.match(/^(\d+(?:\.\d+)?)$/);
  if (decimalMatch) {
    return parseFloat(decimalMatch[1]);
  }

  throw new Error(`Invalid number format: ${text}`);
}

/**
 * Creates a regex pattern that matches all supported number formats.
 *
 * @returns RegExp that matches Unicode fractions, mixed numbers, regular fractions, and decimals
 */
export function createNumberPattern(): RegExp {
  // Get all Unicode fraction characters
  const unicodeFractions = Array.from(UNICODE_FRACTIONS.keys())
    .map(escapeRegExp)
    .join("");

  // Build pattern components
  const patterns = [
    `\\d+\\s*[${unicodeFractions}]`, // Mixed Unicode fractions (1½)
    `[${unicodeFractions}]`, // Pure Unicode fractions (½)
    `\\d+\\s+\\d+/\\d+`, // Mixed regular fractions (1 1/2)
    `\\d+/\\d+`, // Simple fractions (1/2)
    `\\d+(?:\\.\\d+)?`, // Decimal numbers (1 or 1.23)
  ];

  return new RegExp(`(?:${patterns.join("|")})`, "g");
}

/**
 * Finds all number patterns in text and replaces them with parsed decimal values.
 *
 * @param text Input text that may contain various number formats
 * @returns Text with all number patterns converted to decimal format
 *
 * @example
 * normalizeNumbers("Mix 1½ cups with 2 1/4 tsp")
 * // Returns "Mix 1.5 cups with 2.25 tsp"
 */
export function normalizeNumbers(text: string): string {
  const pattern = createNumberPattern();

  return text.replace(pattern, (match) => {
    try {
      const parsed = parseFraction(match.trim());
      // Format to avoid unnecessary decimal places
      return parsed % 1 === 0 ? parsed.toString() : parsed.toString();
    } catch {
      // If parsing fails, return original match
      return match;
    }
  });
}

/**
 * Utility function to escape special regex characters in a string.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
