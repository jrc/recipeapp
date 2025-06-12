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
  const pattern = `(${numberPatternSource})\\s*(${allVariations.join("|")})\\b`;
  return new RegExp(pattern, "gi");
}

const QUANTITY_REGEX = createQuantityRegex();

/**
 * Matches quantities like "2 cups", "1.5 tsp", "1/2 cup" and renders them as HTML spans.
 * Handles fractions, mixed numbers, unicode fractions, and decimals.
 *
 * @param line Plain text
 * @param shouldConvertToMetric - if true, US units will be converted to metric with optimal unit selection
 * @param shouldRoundSatisfyingParam - if true, converted values will be rounded to satisfying numbers.
 *                                     If undefined and shouldConvertToMetric is true, defaults to true.
 *                                     Otherwise defaults to false or the provided value.
 * @returns HTML string with quantities wrapped in <span class="quantity">...</span>
 * @example
 * annotateQuantitiesAsHTML("Add 2 cups flour")
 * // Returns: 'Add <span class="quantity" title="US-CUP=2" data-value="quantity:US-CUP=2">2 cups</span> flour'
 * annotateQuantitiesAsHTML("Mix 1/2 cup milk", true)
 * // Returns: 'Mix <span class="quantity" title="US_CUP=0.5" data-value="quantity:US_CUP=0.5">1/2 cup</span> milk <span class="quantity-metric" title="METRIC_ML=120" data-value="quantity:METRIC_ML=120">(120 mL)</span>'
 * annotateQuantitiesAsHTML("Mix 1/2 cup milk", true, false)
 * // Returns: 'Mix <span class="quantity" title="US_CUP=0.5" data-value="quantity:US_CUP=0.5">1/2 cup</span> milk <span class="quantity-metric" title="METRIC_ML=118.295" data-value="quantity:METRIC_ML=118.295">(118.295 mL)</span>'
 */
export function annotateQuantitiesAsHTML(
  line: string,
  shouldConvertToMetric: boolean = false,
  shouldRoundSatisfyingParam?: boolean,
): string {
  return line.replace(QUANTITY_REGEX, (match, numberPart, unitString) => {
    const unitKey = UNIT_LOOKUP.get(unitString.toLowerCase());

    if (!unitKey) {
      // Fallback - should not happen if our data is consistent
      return match;
    }

    const originalUnit = UNIT_DEFINITIONS.find(
      (unit: UnitDefinition) => unit.key === unitKey,
    );

    if (!originalUnit) {
      // Fallback - should not happen if our data is consistent
      return match;
    }

    try {
      // Use parseFraction to handle all number formats (fractions, mixed numbers, decimals, etc.)
      const originalValue = parseFraction(numberPart.trim());

      let finalValue = originalValue;
      let finalUnit = originalUnit;

      // Determine if rounding should actually be applied
      const applyRounding =
        shouldRoundSatisfyingParam === undefined
          ? shouldConvertToMetric // Default: if converting to metric and not specified, then round.
          : shouldRoundSatisfyingParam; // Otherwise, use the explicitly passed value.

      if (shouldConvertToMetric) {
        // Skip conversion if already metric
        if (originalUnit.key.startsWith("METRIC_")) {
          // Already metric, no conversion needed
          finalValue = originalValue;
          finalUnit = originalUnit;
        } else {
          // Convert to metric system
          try {
            // First convert to base metric unit
            let baseMetricUnit: UnitDefinition;
            if (originalUnit.to_l) {
              baseMetricUnit = UNIT_DEFINITIONS.find(
                (u) => u.key === "METRIC_L",
              )!;
            } else if (originalUnit.to_kg) {
              baseMetricUnit = UNIT_DEFINITIONS.find(
                (u) => u.key === "METRIC_KG",
              )!;
            } else {
              // No conversion available
              return match;
            }

            // Convert to base metric unit
            const [baseValue, baseUnit] = convertMeasurement(
              originalValue,
              originalUnit,
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
            if (applyRounding) {
              finalValue = roundSatisfying(finalValue);
            } else {
              // Ensure consistent precision if not rounding "satisfyingly"
              finalValue = parseFloat(finalValue.toFixed(7));
            }
          } catch (error) {
            // If conversion fails, return original match
            return match;
          }
        }
      }

      let quantityValue = `${originalUnit.key}=${originalValue}`;
      let outHtml = `<span class="quantity" title="${quantityValue}" data-value="quantity:${quantityValue}">${match}</span>`;

      if (shouldConvertToMetric && finalUnit.key !== originalUnit.key) {
        // Show conversion in parentheses
        quantityValue = `${finalUnit.key}=${finalValue}`;
        outHtml += ` <span class="quantity-metric" title="${quantityValue}" data-value="quantity:${quantityValue}">(${finalValue} ${finalUnit.displayName})</span>`;
        return outHtml;
      } else {
        // No conversion or same unit
        return outHtml;
      }
    } catch {
      // If parsing fails, return original match
      return match;
    }
  });
}
