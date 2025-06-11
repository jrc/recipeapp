import { parseFraction, createNumberPattern } from './parse-fraction.js';

interface UnitDefinition {
  standardName: string;
  variations: string[];
}

// Centralized unit knowledge - single source of truth
const UNIT_DEFINITIONS: UnitDefinition[] = [
  { standardName: "US_CUP", variations: ["cups", "cup"] },
  { standardName: "US_TSP", variations: ["teaspoons", "teaspoon", "tsp"] },
  { standardName: "US_TBSP", variations: ["tablespoons", "tablespoon", "tbsp"] },
  { standardName: "METRIC_ML", variations: ["milliliters", "milliliter", "ml"] },
  { standardName: "METRIC_L", variations: ["liters", "liter", "l"] },
  { standardName: "METRIC_G", variations: ["grams", "gram", "g"] },
  { standardName: "METRIC_KG", variations: ["kilograms", "kilogram", "kg"] },
  { standardName: "US_OZ", variations: ["ounces", "ounce", "oz"] },
  { standardName: "US_LB", variations: ["pounds", "pound", "lb"] },
];

// Build lookup map from unit variation to standard name
const UNIT_LOOKUP = new Map<string, string>();
for (const unit of UNIT_DEFINITIONS) {
  for (const variation of unit.variations) {
    UNIT_LOOKUP.set(variation.toLowerCase(), unit.standardName);
  }
}

// Generate regex pattern from unit definitions
// Sort by length descending to ensure longer matches take precedence
function createQuantityRegex(): RegExp {
  const allVariations = UNIT_DEFINITIONS.flatMap((unit) => unit.variations)
    .sort((a, b) => b.length - a.length) // Longer first to avoid partial matches
    .map((variation) => variation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); // Escape special regex chars

  // Use the number pattern from parse-fraction to handle fractions, mixed numbers, etc.
  const numberPatternSource = createNumberPattern().source;
  // Add word boundaries to prevent false matches (e.g., "8 g" in "8 garlic")
  const pattern = `(${numberPatternSource})\\s*(${allVariations.join("|")})\\b`;
  return new RegExp(pattern, "gi");
}

const QUANTITY_REGEX = createQuantityRegex();

/**
 * Matches quantities like "2 cups", "1.5 tsp", "1/2 cup" and renders them as HTML spans.
 * Handles fractions, mixed numbers, unicode fractions, and decimals.
 *
 * @param line Plain text
 * @returns HTML string with quantities wrapped in <span class="quantity">...</span>
 * @example
 * annotateQuantitiesAsHTML("Add 2 cups flour")
 * // Returns: 'Add <span class="quantity" title="US-CUP=2" data-value="quantity:US-CUP=2">2 cups</span> flour'
 * annotateQuantitiesAsHTML("Mix 1/2 cup milk")
 * // Returns: 'Mix <span class="quantity" title="US-CUP=0.5" data-value="quantity:US-CUP=0.5">1/2 cup</span> milk'
 */
export function annotateQuantitiesAsHTML(line: string): string {
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
      const displayUnit = standardUnit.replace(/_/g, '-');
      
      return `<span class="quantity" title="${displayUnit}=${value}" data-value="quantity:${displayUnit}=${value}">${match}</span>`;
    } catch {
      // If parsing fails, return original match
      return match;
    }
  });
}
