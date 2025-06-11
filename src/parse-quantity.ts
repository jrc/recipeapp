import { parseFraction, createNumberPattern } from "./parse-fraction.js";
import { roundSatisfying } from "./round-satisfying";
import {
  UNIT_DEFINITIONS,
  UnitDefinition,
  convertMeasurement,
  getOptimalUnit,
} from "./units.js";

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
 * @param shouldConvertToMetric - if true, US units will be converted to metric with optimal unit selection
 * @param shouldRoundSatisfying - if true, converted values will be rounded to satisfying numbers (default: true)
 * @returns HTML string with quantities wrapped in <span class="quantity">...</span>
 * @example
 * annotateQuantitiesAsHTML("Add 2 cups flour")
 * // Returns: 'Add <span class="quantity" title="US-CUP=2" data-value="quantity:US-CUP=2">2 cups</span> flour'
 * annotateQuantitiesAsHTML("Mix 1/2 cup milk", true)
 * // Returns: 'Mix <span class="quantity" title="METRIC-ML=118" data-value="quantity:METRIC-ML=118">1/2 cup</span> milk'
 * annotateQuantitiesAsHTML("Mix 1/2 cup milk", true, false)
 * // Returns: 'Mix <span class="quantity" title="METRIC-ML=118.295" data-value="quantity:METRIC-ML=118.295">1/2 cup</span> milk'
 */
export function annotateQuantitiesAsHTML(
  line: string,
  shouldConvertToMetric: boolean = false,
  shouldRoundSatisfying: boolean = true,
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

      if (shouldConvertToMetric) {
        const currentUnit = UNIT_DEFINITIONS.find(
          (unit: UnitDefinition) => unit.standardName === standardUnit,
        );

        if (currentUnit) {
          // Skip conversion if already metric
          if (standardUnit.startsWith("METRIC_")) {
            // Already metric, no conversion needed
          }
          // Convert to metric system
          else {
            try {
              // First convert to base metric unit
              let targetUnit: string;
              if (currentUnit.to_l) {
                targetUnit = "METRIC_L"; // Start with liters
              } else if (currentUnit.to_kg) {
                targetUnit = "METRIC_KG"; // Start with kilograms
              } else {
                // No conversion available
                return match;
              }

              // Convert to metric
              const [metricValue, metricUnit] = convertMeasurement(
                value,
                standardUnit,
                targetUnit,
              );

              // Find optimal unit for the converted value
              const optimalUnit = getOptimalUnit(
                metricValue,
                metricUnit,
                "METRIC",
              );

              // Convert to optimal unit if different
              if (optimalUnit !== metricUnit) {
                const [finalValue, finalUnit] = convertMeasurement(
                  metricValue,
                  metricUnit,
                  optimalUnit,
                );
                if (shouldRoundSatisfying) {
                  convertedValue = roundSatisfying(finalValue);
                } else {
                  convertedValue = parseFloat(finalValue.toFixed(7));
                }
                displayUnit = finalUnit.replace(/_/g, "-");
              } else {
                if (shouldRoundSatisfying) {
                  convertedValue = roundSatisfying(metricValue);
                } else {
                  convertedValue = parseFloat(metricValue.toFixed(7));
                }
                displayUnit = metricUnit.replace(/_/g, "-");
              }

              dataValue = `quantity:${displayUnit}=${convertedValue}`;
            } catch (error) {
              // If conversion fails, return original match
              return match;
            }
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
