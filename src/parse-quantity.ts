import { parseFraction, createNumberPattern } from "./parse-fraction.js";
import { UNIT_DEFINITIONS, UnitDefinition } from "./units.js";

// Build lookup map from unit variation to standard name
const UNIT_LOOKUP = new Map<string, string>();
for (const unit of UNIT_DEFINITIONS) {
  for (const variation of unit.variations) {
    UNIT_LOOKUP.set(variation.toLowerCase(), unit.standardName);
  }
}

// Generate regex pattern from unit definitions
function createQuantityRegex(): RegExp {
  const allVariations = UNIT_DEFINITIONS.flatMap(
    (unit: UnitDefinition) => unit.variations,
  )
    .sort((a: string, b: string) => b.length - a.length) // Longer first to avoid partial matches
    .map((variation: string) =>
      variation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );

  // Use the number pattern from parse-fraction to handle fractions, mixed numbers, etc.
  const numberPatternSource = createNumberPattern().source;

  // Add word boundaries to prevent false matches (e.g., "8 g" in "8 garlic")
  const pattern = `(${numberPatternSource})\\s*\\b(${allVariations.join("|")})\\b`;
  return new RegExp(pattern, "gi");
}

const QUANTITY_REGEX = createQuantityRegex();

/**
 * Matches quantities like "2 cups", "1.5 tsp", "1/2 cup" and renders them as HTML spans.
 * Handles fractions, mixed numbers, unicode fractions, and decimals.
 *
 * @param line Plain text
 * @param convertToMetric - if true, US units will be converted to metric
 * @returns HTML string with quantities wrapped in <span class="quantity">...</span>
 * @example
 * annotateQuantitiesAsHTML("Add 2 cups flour")
 * // Returns: 'Add <span class="quantity" title="US-CUP=2" data-value="quantity:US-CUP=2">2 cups</span> flour'
 * annotateQuantitiesAsHTML("Mix 1/2 cup milk")
 * // Returns: 'Mix <span class="quantity" title="US-CUP=0.5" data-value="quantity:US-CUP=0.5">1/2 cup</span> milk'
 */
export function annotateQuantitiesAsHTML(
  line: string,
  convertToMetric: boolean = false,
): string {
  return line.replace(QUANTITY_REGEX, (match, numberPart, unit) => {
    const standardUnit = UNIT_LOOKUP.get(unit.toLowerCase());

    if (!standardUnit) {
      // Fallback - should not happen if our data is consistent
      return match;
    }

    try {
      // Use parseFraction to handle all number formats (fractions, mixed numbers, decimals, etc.)
      const value = parseFraction(numberPart.trim());

      // Convert standardName format: US_CUP -> US-CUP
      let displayUnit = standardUnit.replace(/_/g, "-");
      let convertedValue = value;
      let dataValue = `quantity:${displayUnit}=${value}`;

      if (convertToMetric) {
        const currentUnit = UNIT_DEFINITIONS.find(
          (unit: UnitDefinition) => unit.standardName === standardUnit,
        );

        if (currentUnit) {
          // Skip conversion if already metric
          if (standardUnit.startsWith("METRIC_")) {
            // Already metric, no conversion needed
          }
          // Convert volume units to metric liters
          else if (currentUnit.to_l) {
            const valueInLiters = value * currentUnit.to_l;
            displayUnit = "METRIC-L";
            convertedValue = parseFloat(valueInLiters.toFixed(7)); // Preserve up to 7 decimal places
            dataValue = `quantity:${displayUnit}=${convertedValue}`;
          }
          // Convert mass units to metric kilograms
          else if (currentUnit.to_kg) {
            const valueInKilograms = value * currentUnit.to_kg;
            displayUnit = "METRIC-KG";
            convertedValue = parseFloat(valueInKilograms.toFixed(7)); // Preserve up to 7 decimal places
            dataValue = `quantity:${displayUnit}=${convertedValue}`;
          }
        }
      }

      return `<span class="quantity" title="${displayUnit}=${convertedValue}" data-value="${dataValue}">${match}</span>`;
    } catch {
      // If parsing fails, return original match
      return match;
    }
  });
}
