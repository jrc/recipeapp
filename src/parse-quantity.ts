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

  // Regex:
  // 1. `(${numberPatternSource})`: Captures the numeric part (integer, decimal, fraction).
  // 2. `\\s*`: Matches zero or more whitespace characters.
  // 3. `(${allVariations.join("|")})`: Captures the unit string. Variations are sorted longest first
  //    to ensure correct matching (e.g., "fl oz" before "oz"). Unit variations are regex-escaped.
  // 4. `\\b`: Matches a word boundary to prevent partial matches within words (e.g., "8 g" in "8 garlic").
  const pattern = `(${numberPatternSource})\\s*(${allVariations.join("|")})\\b`;
  return new RegExp(pattern, "gi");
}

const QUANTITY_REGEX = createQuantityRegex();

/**
 * Matches quantities (e.g., \"2 cups\", \"70°F\") in text and renders them as HTML spans with metadata.
 * Handles various number formats. Optionally converts US units (volume, mass, temperature) to metric.
 *
 * @param line The plain text line to process.
 * @param shouldConvertToMetric If `true`, converts US units (volume, mass, temperature) to optimal metric
 *   equivalents (e.g., cups to mL, °F to °C), displayed in parentheses. Defaults to `false`.
 * @param shouldRoundSatisfying Rounding for *converted metric values*. No effect if `shouldConvertToMetric` is `false`.
 *   - `true` (default): Rounds to \"satisfying\" numbers (e.g., 118.295mL -> 120mL; 21.1°C -> 21°C).
 *   - `false`: Celsius is displayed with one decimal (e.g., \"0.0°C\"); volume/mass use higher precision.
 * @returns An HTML string with recognized quantities wrapped in
 *   `<span class=\"quantity\" title=\"UNIT_KEY=value\" data-value=\"quantity:UNIT_KEY=value\">original match</span>`.
 *   If converted, a metric equivalent is appended:
 *   `<span class=\"quantity-metric\" title=\"METRIC_UNIT_KEY=value\" data-value=\"quantity:METRIC_UNIT_KEY=value\">(metric value unit)</span>`.
 * @example
 * annotateQuantitiesAsHTML("Add 2 cups flour")
 * // Returns: 'Add <span class="quantity" title="US_CUP=2" data-value="quantity:US_CUP=2">2 cups</span> flour'
 *
 * annotateQuantitiesAsHTML("Mix 1/2 cup milk", true) // Metric conversion, default satisfying rounding
 * // Returns: 'Mix <span class="quantity" title="US_CUP=0.5" data-value="quantity:US_CUP=0.5">1/2 cup</span> <span class="quantity-metric" title="METRIC_ML=120" data-value="quantity:METRIC_ML=120">(120 ml)</span> milk'
 *
 * annotateQuantitiesAsHTML("Mix 1/2 cup milk", true, false) // Metric conversion, no satisfying rounding
 * // Returns: 'Mix <span class="quantity" title="US_CUP=0.5" data-value="quantity:US_CUP=0.5">1/2 cup</span> <span class="quantity-metric" title="METRIC_ML=118.295" data-value="quantity:METRIC_ML=118.295">(118.295 ml)</span> milk'
 *
 * annotateQuantitiesAsHTML("It's 70°F today", true) // Temperature conversion, default satisfying rounding (70°F -> 21.11...°C -> 21°C)
 * // Returns: 'It\'s <span class="quantity" title="F=70" data-value="quantity:F=70">70°F</span> <span class="quantity-metric" title="C=21" data-value="quantity:C=21">(21°C)</span> today'
 *
 * annotateQuantitiesAsHTML("Heat to 32°F", true, false) // Temp conversion, no satisfying rounding (32°F -> 0°C, displayed as 0.0°C)
 * // Returns: 'Heat to <span class="quantity" title="F=32" data-value="quantity:F=32">32°F</span> <span class="quantity-metric" title="C=0" data-value="quantity:C=0">(0.0°C)</span>'
 */
export function annotateQuantitiesAsHTML(
  line: string,
  shouldConvertToMetric: boolean = false,
  shouldRoundSatisfying: boolean = true,
): string {
  return line.replace(QUANTITY_REGEX, (match, numberPart, unitString) => {
    const unitKey = UNIT_LOOKUP.get(unitString.toLowerCase());

    if (!unitKey) {
      return match;
    }

    const originalUnit = UNIT_DEFINITIONS.find(
      (unit: UnitDefinition) => unit.key === unitKey,
    );

    if (!originalUnit) {
      return match;
    }

    try {
      const originalValue = parseFraction(numberPart.trim());

      let finalValue: number = originalValue; // For data attributes, should be numeric
      let finalUnit: UnitDefinition = originalUnit;
      let displayValueForMetricSpan: string | number = originalValue; // For display text in the metric span, e.g., "(120 ml)" or "(0.0°C)"

      if (shouldConvertToMetric) {
        // Skip conversion if already a metric unit (e.g., "ml", "g", "°C")
        if (originalUnit.type.startsWith("METRIC_")) {
          // Unit is already metric; no conversion needed, all values remain original.
        } else {
          // Attempt conversion for non-metric units
          try {
            if (originalUnit.type === "US_TEMPERATURE") {
              const targetMetricUnit = getOptimalUnit(
                originalValue,
                originalUnit,
                "METRIC",
              );
              if (
                targetMetricUnit &&
                targetMetricUnit.type === "METRIC_TEMPERATURE"
              ) {
                const [convertedValue, convertedUnit] = convertMeasurement(
                  originalValue,
                  originalUnit,
                  targetMetricUnit,
                );
                finalUnit = convertedUnit;

                if (shouldRoundSatisfying) {
                  finalValue = roundSatisfying(convertedValue);
                  displayValueForMetricSpan = finalValue;
                } else {
                  // No satisfying rounding for Celsius:
                  // For display in the span, format to exactly one decimal place (e.g., "0.0", "21.1").
                  // For the 'data-value' attribute, use the numeric value.
                  displayValueForMetricSpan = convertedValue.toFixed(1);
                  finalValue = parseFloat(displayValueForMetricSpan as string);
                }
              }
            } else if (originalUnit.to_l || originalUnit.to_kg) {
              // US Volume or Mass to Metric
              let baseMetricUnitKey = originalUnit.to_l
                ? "METRIC_L"
                : "METRIC_KG";
              const baseMetricUnit = UNIT_DEFINITIONS.find(
                (u) => u.key === baseMetricUnitKey,
              )!;

              const [baseValue, baseUnit] = convertMeasurement(
                originalValue,
                originalUnit,
                baseMetricUnit,
              );

              const optimalUnit = getOptimalUnit(baseValue, baseUnit, "METRIC");

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

              if (shouldRoundSatisfying) {
                finalValue = roundSatisfying(finalValue);
              } else {
                finalValue = parseFloat(finalValue.toFixed(7));
              }
              displayValueForMetricSpan = finalValue;
            }
            // Unhandled US unit types (not Temperature, Volume, or Mass with to_l/to_kg) are not converted;
            // values remain original.
          } catch (error) {
            // On error during conversion attempt, original values are used,
            // effectively showing only the original match without a metric span.
          }
        }
      } else {
        // Not converting to metric, displayValueForMetricSpan is same as originalValue
        displayValueForMetricSpan = originalValue;
      }

      let quantityValueForAttr = `${originalUnit.key}=${originalValue}`;
      let outHtml = `<span class="quantity" title="${quantityValueForAttr}" data-value="quantity:${quantityValueForAttr}">${match}</span>`;

      // Add metric span only if conversion happened and the unit actually changed
      if (shouldConvertToMetric && finalUnit.key !== originalUnit.key) {
        quantityValueForAttr = `${finalUnit.key}=${finalValue}`; // Use numeric finalValue for data attribute
        // For temperature units like °C or °F, omit the space before the unit symbol.
        const space = finalUnit.type.includes("TEMPERATURE") ? "" : " ";
        outHtml += ` <span class="quantity-metric" title="${quantityValueForAttr}" data-value="quantity:${quantityValueForAttr}">(${displayValueForMetricSpan}${space}${finalUnit.displayName})</span>`;
      }
      return outHtml;
    } catch (error) {
      // If parsing numberPart fails, return original match
      return match;
    }
  });
}
