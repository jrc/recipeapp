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
    UNIT_LOOKUP.set(variation.toLowerCase(), unit.key);
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
  shouldRoundSatisfying: boolean = false,
): string {
  return line.replace(QUANTITY_REGEX, (match, numberPart, unitString) => {
    const unitKey = UNIT_LOOKUP.get(unitString.toLowerCase());

    if (!unitKey) {
      // Fallback - should not happen if our data is consistent
      return match;
    }

    const initialUnit = UNIT_DEFINITIONS.find(
      (unit: UnitDefinition) => unit.key === unitKey,
    );

    if (!initialUnit) {
      // Fallback - should not happen if our data is consistent
      return match;
    }

    try {
      // Use parseFraction to handle all number formats (fractions, mixed numbers, decimals, etc.)
      const originalValue = parseFraction(numberPart.trim());

      let finalValue = originalValue;
      let finalUnit = initialUnit;

      if (shouldConvertToMetric) {
        // Skip conversion if already metric
        if (initialUnit.key.startsWith("METRIC_")) {
          // Already metric, no conversion needed
          finalValue = originalValue;
          finalUnit = initialUnit;
        } else {
          // Convert to metric system
          try {
            // First convert to base metric unit
            let baseMetricUnit: UnitDefinition;
            if (initialUnit.to_l) {
              baseMetricUnit = UNIT_DEFINITIONS.find(u => u.key === "METRIC_L")!;
            } else if (initialUnit.to_kg) {
              baseMetricUnit = UNIT_DEFINITIONS.find(u => u.key === "METRIC_KG")!;
            } else {
              // No conversion available
              return match;
            }

            // Convert to base metric unit
            const [baseValue, baseUnit] = convertMeasurement(
              originalValue,
              initialUnit,
              baseMetricUnit,
            );

            // Find optimal unit for the converted value
            const optimalUnit = getOptimalUnit(baseValue, baseUnit, "METRIC");

            // Convert to optimal unit if different from base
            if (optimalUnit.key !== baseUnit.key) {
              const [optimalValue, optimalUnitResult] = convertMeasurement(
                baseValue,
                baseUnit,
                optimalUnit,
              );
              finalValue = optimalValue;
              finalUnit = optimalUnitResult;
            } else {
              finalValue = baseValue;
              finalUnit = baseUnit;
            }

            // Apply rounding if requested
            if (shouldRoundSatisfying) {
              finalValue = roundSatisfying(finalValue);
            } else {
              finalValue = parseFloat(finalValue.toFixed(7));
            }
          } catch (error) {
            // If conversion fails, return original match
            return match;
          }
        }
      }

      // Format unit key for data attributes (replace underscores with hyphens)
      const dataUnitKey = finalUnit.key.replace(/_/g, "-");
      const title = `${dataUnitKey}=${finalValue}`;
      const dataValue = `quantity:${dataUnitKey}=${finalValue}`;

      if (shouldConvertToMetric && finalUnit.key !== initialUnit.key) {
        // Show conversion in parentheses
        return `<span class="quantity" title="${title}" data-value="${dataValue}">${match} (${finalValue} ${finalUnit.displayName})</span>`;
      } else {
        // No conversion or same unit
        return `<span class="quantity" title="${title}" data-value="${dataValue}">${match}</span>`;
      }
    } catch {
      // If parsing fails, return original match
      return match;
    }
  });
}