export interface UnitDefinition {
  key: string;
  variations: string[];
  displayName: string;
  type: string;
  to_l?: number;
  to_kg?: number;
}

// Centralized unit knowledge - single source of truth
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
];

/**
 * Convert a measurement value between compatible units.
 */
export function convertMeasurement(
  value: number,
  sourceUnit: UnitDefinition,
  targetUnit: UnitDefinition,
): [number, UnitDefinition] {
  if (!sourceUnit || !targetUnit) {
    throw new Error(`Invalid unit: ${sourceUnit?.key} or ${targetUnit?.key}`);
  }

  // Check compatibility (same measurement type)
  const sourceType = sourceUnit.type.split("_")[1]; // VOLUME, MASS
  const targetType = targetUnit.type.split("_")[1];

  if (sourceType !== targetType) {
    throw new Error(`Can't convert ${sourceUnit.key} to ${targetUnit.key}`);
  }

  let baseValue: number;
  let convertedValue: number;

  if (sourceUnit.to_l && targetUnit.to_l) {
    // Volume conversion via liters
    baseValue = value * sourceUnit.to_l;
    convertedValue = baseValue / targetUnit.to_l;
  } else if (sourceUnit.to_kg && targetUnit.to_kg) {
    // Mass conversion via kilograms
    baseValue = value * sourceUnit.to_kg;
    convertedValue = baseValue / targetUnit.to_kg;
  } else {
    throw new Error(
      `Incompatible units: ${sourceUnit.key} and ${targetUnit.key}`,
    );
  }

  return [convertedValue, targetUnit];
}

/**
 * Find the most appropriate unit for a measurement value.
 * Returns a unit that keeps the measurement >= 1 when possible.
 */
export function getOptimalUnit(
  value: number,
  currentUnit: UnitDefinition,
  system?: string,
): UnitDefinition {
  if (!currentUnit) {
    throw new Error(`Invalid unit provided to getOptimalUnit`);
  }

  // Special cases - keep TSP and TBSP as-is
  if (currentUnit.key === "TSP" || currentUnit.key === "TBSP") {
    return currentUnit;
  }

  // Determine systems
  const initialSystem = currentUnit.type.startsWith("METRIC") ? "METRIC" : "US";
  const targetSystem = system || initialSystem;

  // Convert to base units
  const baseValue = value * (currentUnit.to_kg || currentUnit.to_l || 1);

  // Find compatible units in target system
  const measurementType = currentUnit.type.split("_")[1]; // VOLUME or MASS
  const targetType = `${targetSystem}_${measurementType}`;
  const sortKey = currentUnit.to_l ? "to_l" : "to_kg";

  // Get units of the same type, sorted by conversion factor (smallest first)
  const compatibleUnits = UNIT_DEFINITIONS.filter(
    (unit) =>
      unit.type === targetType && (sortKey === "to_l" ? unit.to_l : unit.to_kg),
  ).sort((a, b) => {
    const aFactor = sortKey === "to_l" ? a.to_l! : a.to_kg!;
    const bFactor = sortKey === "to_l" ? b.to_l! : b.to_kg!;
    return aFactor - bFactor;
  });

  // Find the largest unit where converted value >= 1
  let optimalUnit: UnitDefinition = currentUnit;
  let foundOptimalUnit = false;

  for (const unit of compatibleUnits) {
    const factor = sortKey === "to_l" ? unit.to_l! : unit.to_kg!;
    if (baseValue / factor >= 1) {
      optimalUnit = unit;
      foundOptimalUnit = true;
    } else {
      break;
    }
  }

  // If no unit gives us >= 1, use the smallest unit available
  if (!foundOptimalUnit && compatibleUnits.length > 0) {
    optimalUnit = compatibleUnits[0]; // Smallest unit
  }

  return optimalUnit;
}
