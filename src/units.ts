export interface UnitDefinition {
  standardName: string;
  variations: string[];
  to_l?: number;
  to_kg?: number;
}

// Centralized unit knowledge - single source of truth
export const UNIT_DEFINITIONS: UnitDefinition[] = [
  {
    standardName: "TSP",
    variations: ["teaspoons", "teaspoon", "tsp"],
    to_l: 0.00493,
  },
  {
    standardName: "TBSP",
    variations: ["tablespoons", "tablespoon", "tbsp"],
    to_l: 0.01479,
  },
  {
    standardName: "US_FLOZ",
    variations: ["fluid ounces", "fluid ounce", "fl oz", "fl. oz."],
    to_l: 0.02957,
  },
  { standardName: "US_CUP", variations: ["cups", "cup"], to_l: 0.23659 },
  {
    standardName: "US_PINT",
    variations: ["pints", "pint", "pt"],
    to_l: 0.47318,
  },
  {
    standardName: "US_QT",
    variations: ["quarts", "quart", "qt"],
    to_l: 0.94635,
  },
  {
    standardName: "US_GAL",
    variations: ["gallons", "gallon", "gal", "gal."],
    to_l: 3.78541,
  },
  {
    standardName: "US_OZ",
    variations: ["ounces", "ounce", "oz"],
    to_kg: 0.02835,
  },
  {
    standardName: "US_LB",
    variations: ["pounds", "pound", "lb"],
    to_kg: 0.45359,
  },
  {
    standardName: "METRIC_ML",
    variations: ["milliliters", "milliliter", "ml"],
    to_l: 0.001,
  },
  { standardName: "METRIC_L", variations: ["liters", "liter", "l"], to_l: 1 },
  {
    standardName: "METRIC_G",
    variations: ["grams", "gram", "g"],
    to_kg: 0.001,
  },
  {
    standardName: "METRIC_KG",
    variations: ["kilograms", "kilogram", "kg"],
    to_kg: 1,
  },
];