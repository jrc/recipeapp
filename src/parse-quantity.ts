interface UnitDefinition {
  standardName: string;
  variations: string[];
}

// Centralized unit knowledge - single source of truth
const UNIT_DEFINITIONS: UnitDefinition[] = [
  { standardName: "US_CUP", variations: ["cups", "cup"] },
  { standardName: "US_TSP", variations: ["teaspoons", "tsp"] },
  { standardName: "US_TBSP", variations: ["tablespoons", "tbsp"] },
  { standardName: "METRIC_ML", variations: ["milliliters", "ml"] },
  { standardName: "METRIC_L", variations: ["liters", "l"] },
  { standardName: "METRIC_G", variations: ["grams", "g"] },
  { standardName: "METRIC_KG", variations: ["kilograms", "kg"] },
  { standardName: "US_OZ", variations: ["ounces", "oz"] },
  { standardName: "US_LB", variations: ["pounds", "lb"] }
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
  const allVariations = UNIT_DEFINITIONS
    .flatMap(unit => unit.variations)
    .sort((a, b) => b.length - a.length) // Longer first to avoid partial matches
    .map(variation => variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // Escape special regex chars
  
  const pattern = `(\\d+(?:\\.\\d+)?)\\s*(${allVariations.join('|')})`;
  return new RegExp(pattern, 'gi');
}

const QUANTITY_REGEX = createQuantityRegex();

export function annotateQuantities(line: string): string {
  return line.replace(QUANTITY_REGEX, (match, quantity, unit) => {
    const standardUnit = UNIT_LOOKUP.get(unit.toLowerCase());
    const value = parseFloat(quantity);
    
    if (!standardUnit) {
      // Fallback - should not happen if our data is consistent
      return match;
    }
    
    return `[${match}](quantity:${standardUnit}=${value})`;
  });
}