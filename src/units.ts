/**
 * Defines the structure for a unit of measurement.
 * @property key - Unique identifier (e.g., "US_CUP", "METRIC_L", "F").
 * @property variations - Common string representations for parsing (e.g., "cups", "cup").
 * @property displayName - Representation for display (e.g., "cup", "ml", "°F").
 * @property type - Measurement system and type (e.g., "US_VOLUME", "METRIC_TEMPERATURE").
 *                  The part after "_" is the base type (e.g., "VOLUME").
 * @property to_l - Optional. For volume units, factor to convert to 1 liter.
 * @property to_kg - Optional. For mass units, factor to convert to 1 kilogram.
 *                   Temperature units use direct formulas, not these factors.
 */
export interface UnitDefinition {
  key: string;
  variations: string[];
  displayName: string;
  type: string;
  to_l?: number;
  to_kg?: number;
}

/** Defines all supported units and their properties for parsing, display, and conversion. */
export const UNIT_DEFINITIONS: UnitDefinition[] = [
  {
    key: "TSP",
    variations: ["teaspoons", "teaspoon", "tsp"],
    displayName: "teaspoons",
    type: "US_VOLUME",
    to_l: 0.005,
  },
  {
    key: "TBSP",
    variations: ["tablespoons", "tablespoon", "tbsp"],
    displayName: "tablespoons",
    type: "US_VOLUME",
    to_l: 0.015,
  },
  {
    key: "US_FLOZ",
    variations: ["fl oz", "fl. oz.", "fluid ounces", "fluid ounce"],
    displayName: "fl oz",
    type: "US_VOLUME",
    to_l: 0.02957,
  },
  {
    key: "US_CUP",
    variations: ["cup", "cups"],
    displayName: "cup",
    type: "US_VOLUME",
    to_l: 0.23659,
  },
  {
    key: "US_PINT",
    variations: ["pt", "pint", "pints"],
    displayName: "pt",
    type: "US_VOLUME",
    to_l: 0.47318,
  },
  {
    key: "US_QT",
    variations: ["qt", "quart", "quarts"],
    displayName: "qt",
    type: "US_VOLUME",
    to_l: 0.94635,
  },
  {
    key: "US_GAL",
    variations: ["gal", "gal.", "gallon", "gallons"],
    displayName: "gal",
    type: "US_VOLUME",
    to_l: 3.78541,
  },
  {
    key: "US_OZ",
    variations: ["oz", "ounce", "ounces"],
    displayName: "oz",
    type: "US_MASS",
    to_kg: 0.02835,
  },
  {
    key: "US_LB",
    variations: ["lb", "pound", "pound"],
    displayName: "lb",
    type: "US_MASS",
    to_kg: 0.45359,
  },
  {
    key: "METRIC_ML",
    variations: ["ml", "milliliter", "milliliters"],
    displayName: "ml",
    type: "METRIC_VOLUME",
    to_l: 0.001,
  },
  {
    key: "METRIC_L",
    variations: ["l", "liter", "liters"],
    displayName: "l",
    type: "METRIC_VOLUME",
    to_l: 1,
  },
  {
    key: "METRIC_G",
    variations: ["g", "gram", "grams"],
    displayName: "g",
    type: "METRIC_MASS",
    to_kg: 0.001,
  },
  {
    key: "METRIC_KG",
    variations: ["kg", "kilogram", "kilograms"],
    displayName: "kg",
    type: "METRIC_MASS",
    to_kg: 1,
  },
  {
    key: "F",
    variations: ["F", "°F", "Fahrenheit", "degrees Fahrenheit"],
    displayName: "°F",
    type: "US_TEMPERATURE",
  },
  {
    key: "C",
    variations: ["C", "°C", "Celsius"],
    displayName: "°C",
    type: "METRIC_TEMPERATURE",
  },
];

/**
 * Converts a measurement value from a source unit to a target unit.
 * Handles volume (via liters), mass (via kilograms), and temperature (F/C formulas).
 *
 * @param value The numeric value to convert.
 * @param sourceUnit Definition of the original unit.
 * @param targetUnit Definition of the unit to convert to.
 * @returns A tuple: `[convertedNumericValue, targetUnitDefinition]`.
 * @throws Error if units are invalid, types are incompatible (e.g., volume to mass),
 *   or a specific conversion path is unsupported.
 */
export function convertMeasurement(
  value: number,
  sourceUnit: UnitDefinition,
  targetUnit: UnitDefinition,
): [number, UnitDefinition] {
  if (!sourceUnit || !targetUnit) {
    throw new Error(
      `Invalid unit provided for conversion: sourceUnit key '${sourceUnit?.key}', targetUnit key '${targetUnit?.key}'.`,
    );
  }

  // Extract base measurement type (e.g., "VOLUME", "MASS", "TEMPERATURE")
  const sourceBaseType = sourceUnit.type.split("_")[1];
  const targetBaseType = targetUnit.type.split("_")[1];

  // Ensure units share the same base measurement type (e.g., VOLUME, MASS).
  if (sourceBaseType !== targetBaseType) {
    throw new Error(
      `Cannot convert ${sourceUnit.key} to ${targetUnit.key} due to incompatible measurement types: ${sourceBaseType} vs ${targetBaseType}.`,
    );
  }

  let convertedValue: number;

  if (sourceBaseType === "TEMPERATURE") {
    // Temperature conversions are formula-based.
    if (sourceUnit.key === "F" && targetUnit.key === "C") {
      convertedValue = (value - 32) * (5 / 9); // Fahrenheit to Celsius
    } else if (sourceUnit.key === "C" && targetUnit.key === "F") {
      convertedValue = value * (9 / 5) + 32; // Celsius to Fahrenheit
    } else if (sourceUnit.key === targetUnit.key) {
      convertedValue = value; // Same unit.
    } else {
      // Should not be reached if getOptimalUnit provides valid F/C targets.
      throw new Error(
        `Unsupported temperature conversion path: ${sourceUnit.key} to ${targetUnit.key}.`,
      );
    }
  } else if (sourceUnit.to_l && targetUnit.to_l) {
    // Volume conversion via liters
    const baseValue = value * sourceUnit.to_l;
    convertedValue = baseValue / targetUnit.to_l;
  } else if (sourceUnit.to_kg && targetUnit.to_kg) {
    // Mass conversion via kilograms
    const baseValue = value * sourceUnit.to_kg;
    convertedValue = baseValue / targetUnit.to_kg;
  } else {
    throw new Error(
      `Conversion not defined for units: ${sourceUnit.key} and ${targetUnit.key}`,
    );
  }

  return [convertedValue, targetUnit];
}

/**
 * Finds the most appropriate unit for a measurement, optionally in a target system (US or Metric).
 *
 * Behavior varies by measurement type:
 * - **Volume/Mass**: Selects the largest unit in the target system where the value is >= 1.
 *   If no such unit exists, the smallest unit of that type/system is chosen (e.g., 0.0001 L -> 0.1 mL).
 *   This enhances readability (e.g., "1 L" vs. "1000 mL").
 * - **Temperature**: Returns the standard unit for the target system (Celsius for METRIC, Fahrenheit for US)
 *   if a system change is requested. Otherwise, returns the current unit.
 * - **Special Cases**: "TSP" and "TBSP" are always returned as-is due to common recipe usage.
 *
 * @param value The numeric value of the measurement.
 * @param currentUnit Definition of the current unit for the value.
 * @param system Optional. The target system ("METRIC" or "US") to find the optimal unit in.
 *               If not provided, the system of the `currentUnit` is used.
 * @returns The `UnitDefinition` of the most appropriate unit.
 * @throws Error if `currentUnit` is invalid.
 */
export function getOptimalUnit(
  value: number,
  currentUnit: UnitDefinition,
  system?: string,
): UnitDefinition {
  if (!currentUnit) {
    throw new Error(`Invalid currentUnit provided to getOptimalUnit.`);
  }

  // TSP and TBSP are common culinary units; always keep them as-is.
  if (currentUnit.key === "TSP" || currentUnit.key === "TBSP") {
    return currentUnit;
  }

  // Determine systems
  const initialSystem = currentUnit.type.startsWith("METRIC") ? "METRIC" : "US";
  const targetSystem = system || initialSystem; // Default to current unit's system if not specified
  const baseMeasurementType = currentUnit.type.split("_")[1]; // "VOLUME", "MASS", or "TEMPERATURE"

  if (baseMeasurementType === "TEMPERATURE") {
    // For temperature, optimal unit is simply the standard unit of the target system.
    if (targetSystem === "METRIC") {
      return UNIT_DEFINITIONS.find((u) => u.key === "C")!; // Celsius
    } else if (targetSystem === "US") {
      return UNIT_DEFINITIONS.find((u) => u.key === "F")!; // Fahrenheit
    }
    return currentUnit; // If target system matches current or is unknown, no change.
  }

  // For Volume and Mass:
  // 1. Convert the current value to a base unit value (liters for volume, kilograms for mass).
  const baseValueInStandardUnit =
    value * (currentUnit.to_kg || currentUnit.to_l || 1);

  // Identify compatible units in the target system and measurement type.
  const targetType = `${targetSystem}_${baseMeasurementType}`;
  const sortKey = currentUnit.to_l ? "to_l" : "to_kg";

  // Sort compatible units by size (smallest conversion factor first).
  const compatibleUnits = UNIT_DEFINITIONS.filter(
    (unit) =>
      unit.type === targetType && (sortKey === "to_l" ? unit.to_l : unit.to_kg),
  ).sort((a, b) => {
    const aFactor = sortKey === "to_l" ? a.to_l! : a.to_kg!;
    const bFactor = sortKey === "to_l" ? b.to_l! : b.to_kg!;
    return aFactor - bFactor;
  });

  // Find the largest unit in the target system where the converted value is >= 1
  // for better human readability.
  let optimalUnit: UnitDefinition = currentUnit;

  if (compatibleUnits.length > 0) {
    // Default to the current unit if it's compatible, or the smallest compatible unit.
    optimalUnit =
      compatibleUnits.find((u) => u.key === currentUnit.key) ||
      compatibleUnits[0];

    let foundAnOptimalUnitWhereValueIsGteOne = false;
    for (const potentialOptimalUnit of compatibleUnits) {
      const conversionFactor =
        sortKey === "to_l"
          ? potentialOptimalUnit.to_l!
          : potentialOptimalUnit.to_kg!;
      if (baseValueInStandardUnit / conversionFactor >= 1) {
        optimalUnit = potentialOptimalUnit;
        foundAnOptimalUnitWhereValueIsGteOne = true;
      } else {
        // Value is < 1 for this unit; larger units will also be < 1.
        // The previously assigned optimalUnit (if any) is the best fit.
        break;
      }
    }

    // If no unit resulted in a value >= 1 (e.g., for very small quantities),
    // use the smallest unit of the target type.
    if (!foundAnOptimalUnitWhereValueIsGteOne) {
      optimalUnit = compatibleUnits[0];
    }
  }
  // If no compatible units were found (e.g., misconfiguration), defaults to returning the original currentUnit.

  return optimalUnit;
}
