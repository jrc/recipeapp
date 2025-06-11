export interface UnitDefinition {
  standardName: string;
  variations: string[];
  type: string;
  to_l?: number;
  to_kg?: number;
}

// Centralized unit knowledge - single source of truth
export const UNIT_DEFINITIONS: UnitDefinition[] = [
  {
    standardName: "TSP",
    variations: ["teaspoons", "teaspoon", "tsp"],
    type: "US_VOLUME",
    to_l: 0.00493,
  },
  {
    standardName: "TBSP",
    variations: ["tablespoons", "tablespoon", "tbsp"],
    type: "US_VOLUME",
    to_l: 0.01479,
  },
  {
    standardName: "US_FLOZ",
    variations: ["fluid ounces", "fluid ounce", "fl oz", "fl. oz."],
    type: "US_VOLUME",
    to_l: 0.02957,
  },
  { standardName: "US_CUP", variations: ["cups", "cup"], type: "US_VOLUME", to_l: 0.23659 },
  {
    standardName: "US_PINT",
    variations: ["pints", "pint", "pt"],
    type: "US_VOLUME",
    to_l: 0.47318,
  },
  {
    standardName: "US_QT",
    variations: ["quarts", "quart", "qt"],
    type: "US_VOLUME",
    to_l: 0.94635,
  },
  {
    standardName: "US_GAL",
    variations: ["gallons", "gallon", "gal", "gal."],
    type: "US_VOLUME",
    to_l: 3.78541,
  },
  {
    standardName: "US_OZ",
    variations: ["ounces", "ounce", "oz"],
    type: "US_MASS",
    to_kg: 0.02835,
  },
  {
    standardName: "US_LB",
    variations: ["pounds", "pound", "lb"],
    type: "US_MASS",
    to_kg: 0.45359,
  },
  {
    standardName: "METRIC_ML",
    variations: ["milliliters", "milliliter", "ml"],
    type: "METRIC_VOLUME",
    to_l: 0.001,
  },
  { standardName: "METRIC_L", variations: ["liters", "liter", "l"], type: "METRIC_VOLUME", to_l: 1 },
  {
    standardName: "METRIC_G",
    variations: ["grams", "gram", "g"],
    type: "METRIC_MASS",
    to_kg: 0.001,
  },
  {
    standardName: "METRIC_KG",
    variations: ["kilograms", "kilogram", "kg"],
    type: "METRIC_MASS",
    to_kg: 1,
  },
];

/**
 * Convert a measurement value between compatible units.
 */
export function convertMeasurement(
  value: number,
  sourceUnitKey: string,
  targetUnitKey: string,
): [number, string] {
  const sourceUnit = UNIT_DEFINITIONS.find(u => u.standardName === sourceUnitKey);
  const targetUnit = UNIT_DEFINITIONS.find(u => u.standardName === targetUnitKey);

  if (!sourceUnit || !targetUnit) {
    throw new Error(`Invalid unit: ${sourceUnitKey} or ${targetUnitKey}`);
  }

  // Check compatibility (same measurement type)
  const sourceType = sourceUnit.type.split('_')[1]; // VOLUME, MASS
  const targetType = targetUnit.type.split('_')[1];
  
  if (sourceType !== targetType) {
    throw new Error(`Can't convert ${sourceUnitKey} to ${targetUnitKey}`);
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
    throw new Error(`Incompatible units: ${sourceUnitKey} and ${targetUnitKey}`);
  }

  return [convertedValue, targetUnitKey];
}

/**
 * Find the most appropriate unit for a measurement value.
 * Returns a unit that keeps the measurement >= 1 when possible.
 */
export function getOptimalUnit(
  value: number,
  unitKey: string,
  system?: string,
): string {
  const currentUnit = UNIT_DEFINITIONS.find(u => u.standardName === unitKey);
  if (!currentUnit) {
    throw new Error(`Invalid unit key: ${unitKey}`);
  }

  // Special cases - keep TSP and TBSP as-is
  if (unitKey === 'TSP' || unitKey === 'TBSP') {
    return unitKey;
  }

  // Determine systems
  const initialSystem = currentUnit.type.startsWith('METRIC') ? 'METRIC' : 'US';
  const targetSystem = system || initialSystem;

  // Convert to base units
  const baseValue = value * (currentUnit.to_kg || currentUnit.to_l || 1);
  
  // Find compatible units in target system
  const measurementType = currentUnit.type.split('_')[1]; // VOLUME or MASS
  const targetType = `${targetSystem}_${measurementType}`;
  const sortKey = currentUnit.to_l ? 'to_l' : 'to_kg';

  // Get units of the same type, sorted by conversion factor (smallest first)
  const compatibleUnits = UNIT_DEFINITIONS
    .filter(unit => 
      unit.type === targetType && 
      (sortKey === 'to_l' ? unit.to_l : unit.to_kg)
    )
    .sort((a, b) => {
      const aFactor = sortKey === 'to_l' ? a.to_l! : a.to_kg!;
      const bFactor = sortKey === 'to_l' ? b.to_l! : b.to_kg!;
      return aFactor - bFactor;
    });

  // Find the largest unit where converted value >= 1
  let optimalUnit = unitKey;
  let foundOptimalUnit = false;
  
  for (const unit of compatibleUnits) {
    const factor = sortKey === 'to_l' ? unit.to_l! : unit.to_kg!;
    if (baseValue / factor >= 1) {
      optimalUnit = unit.standardName;
      foundOptimalUnit = true;
    } else {
      break;
    }
  }

  // If no unit gives us >= 1, use the smallest unit available
  if (!foundOptimalUnit && compatibleUnits.length > 0) {
    optimalUnit = compatibleUnits[0].standardName; // Smallest unit
  }

  return optimalUnit;
}