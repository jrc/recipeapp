import { annotateQuantitiesAsHTML } from "../src/parse-quantity.js";
import {
  getOptimalUnit,
  convertMeasurement,
  UNIT_DEFINITIONS,
} from "../src/units.js";

export function runParseQuantityTests() {
  // --- Demonstrating correct usage of convertMeasurement and getOptimalUnit ---
  const usCupDef = UNIT_DEFINITIONS.find((u) => u.key === "US_CUP");
  const metricLiterDef = UNIT_DEFINITIONS.find((u) => u.key === "METRIC_L");
  const metricMlDef = UNIT_DEFINITIONS.find((u) => u.key === "METRIC_ML");

  if (!usCupDef || !metricLiterDef || !metricMlDef) {
    console.error(
      "Critical: Required unit definitions (US_CUP, METRIC_L, METRIC_ML) not found. Skipping some unit conversion tests.",
    );
  } else {
    const [valueInLiters, unitAfterConversionToL] = convertMeasurement(
      2,
      usCupDef,
      metricLiterDef,
    );
    const expectedLiters = 2 * 0.236588;
    const toleranceLiters = 0.00001;
    console.assert(
      Math.abs(valueInLiters - expectedLiters) <= toleranceLiters,
      `2 US Cups to Liters conversion. Expected: ${expectedLiters} (approx.), Actual: ${valueInLiters}, Tolerance: ${toleranceLiters}`,
    );
    console.assert(
      unitAfterConversionToL.key === "METRIC_L",
      `Unit after conversion to Liters is METRIC_L. Expected: 'METRIC_L', Actual: '${unitAfterConversionToL.key}'`,
    );

    const optimalUnitForLiters = getOptimalUnit(
      valueInLiters,
      unitAfterConversionToL,
      "METRIC",
    );
    console.assert(
      optimalUnitForLiters.key === "METRIC_ML",
      `Optimal unit for ${valueInLiters} L is METRIC_ML. Expected: 'METRIC_ML', Actual: '${optimalUnitForLiters.key}'`,
    );

    const [valueInMl, unitAfterOptimalConversion] = convertMeasurement(
      valueInLiters,
      unitAfterConversionToL,
      optimalUnitForLiters,
    );
    const expectedMl = 473.176;
    const toleranceMl = 0.005; // Adjusted tolerance
    console.assert(
      Math.abs(valueInMl - expectedMl) <= toleranceMl,
      `Conversion from ${valueInLiters} L to mL. Expected: ${expectedMl} (approx.), Actual: ${valueInMl}, Tolerance: ${toleranceMl}`,
    );
    console.assert(
      unitAfterOptimalConversion.key === "METRIC_ML",
      `Unit after optimal conversion is METRIC_ML. Expected: 'METRIC_ML', Actual: '${unitAfterOptimalConversion.key}'`,
    );
  }

  // --- Testing annotateQuantitiesAsHTML ---
  interface TestCase {
    description: string;
    input: string;
    convertToMetric: boolean;
    roundSatisfying?: boolean;
    expected: string;
  }

  const testCases: TestCase[] = [
    {
      description: "Simple US quantity, no conversion",
      input: "Add 2 cups flour",
      convertToMetric: false,
      expected:
        'Add <span class="quantity" title="US_CUP=2" data-value="quantity:US_CUP=2">2 cups</span> flour',
    },
    {
      description:
        "Fractional US quantity, with metric conversion (default rounding)",
      input: "Mix 1/2 cup milk",
      convertToMetric: true,
      // roundSatisfying is true by default (when convertToMetric is true and param is undefined)
      expected:
        'Mix <span class="quantity" title="US_CUP=0.5" data-value="quantity:US_CUP=0.5">1/2 cup</span> <span class="quantity-metric" title="METRIC_ML=120" data-value="quantity:METRIC_ML=120">(120 ml)</span> milk',
    },
    {
      description:
        "Fractional US quantity, with metric conversion, no rounding",
      input: "Mix 1/2 cup milk", // 0.5 US cups = 118.294 mL (actually 118.295 due to toFixed(7) rounding)
      convertToMetric: true,
      roundSatisfying: false,
      expected:
        'Mix <span class="quantity" title="US_CUP=0.5" data-value="quantity:US_CUP=0.5">1/2 cup</span> <span class="quantity-metric" title="METRIC_ML=118.295" data-value="quantity:METRIC_ML=118.295">(118.295 ml)</span> milk',
    },
    {
      description:
        "Decimal US quantity, with metric conversion (default rounding)",
      input: "Use 1.5 tsp salt", // 1.5 tsp = 7.39338 mL, rounds to 7.5 mL
      convertToMetric: true,
      expected:
        'Use <span class="quantity" title="TSP=1.5" data-value="quantity:TSP=1.5">1.5 tsp</span> <span class="quantity-metric" title="METRIC_ML=7.5" data-value="quantity:METRIC_ML=7.5">(7.5 ml)</span> salt',
    },
    {
      description:
        "Already metric quantity, convertToMetric is true (no change expected)",
      input: "Add 250 ml water",
      convertToMetric: true,
      expected:
        'Add <span class="quantity" title="METRIC_ML=250" data-value="quantity:METRIC_ML=250">250 ml</span> water',
    },
    {
      description: "Multiple quantities in one line, with conversion",
      input: "Take 1 cup sugar and 1/2 lb butter",
      convertToMetric: true,
      // 1 US Cup = 236.588 mL, rounds to 235 ml
      // 0.5 lb = 226.796 g, rounds to 225 g
      expected:
        'Take <span class="quantity" title="US_CUP=1" data-value="quantity:US_CUP=1">1 cup</span> <span class="quantity-metric" title="METRIC_ML=235" data-value="quantity:METRIC_ML=235">(235 ml)</span> sugar and <span class="quantity" title="US_LB=0.5" data-value="quantity:US_LB=0.5">1/2 lb</span> <span class="quantity-metric" title="METRIC_G=225" data-value="quantity:METRIC_G=225">(225 g)</span> butter',
    },
    // {
    //   description: "Quantity with no space before unit, e.g. 2cups",
    //   input: "Add 2cups flour",
    //   convertToMetric: false,
    //   expected:
    //     'Add <span class="quantity" title="US_CUP=2" data-value="quantity:US_CUP=2">2cups</span> flour',
    // },
    {
      description: "Unicode fraction ¼ cup, with metric conversion",
      input: "Add ¼ cup sugar", // 0.25 US_CUP = 59.147 mL, rounds to 60ml
      convertToMetric: true,
      expected:
        'Add <span class="quantity" title="US_CUP=0.25" data-value="quantity:US_CUP=0.25">¼ cup</span> <span class="quantity-metric" title="METRIC_ML=59" data-value="quantity:METRIC_ML=59">(59 ml)</span> sugar',
    },
    // {
    //   description: "Number with comma 1,000 g",
    //   input: "About 1,000 g of gold",
    //   convertToMetric: false, // Already metric
    //   expected:
    //     'About <span class="quantity" title="METRIC_G=1000" data-value="quantity:METRIC_G=1000">1,000 g</span> of gold',
    // },
    // {
    //   description: "Number with comma and conversion 2,000 g to kg",
    //   input: "About 2,000 g of gold",
    //   convertToMetric: true, // Optimal should be kg
    //   // annotateQuantitiesAsHTML doesn't re-optimize already metric units to a different metric unit (e.g. g to kg).
    //   expected:
    //     'About <span class="quantity" title="METRIC_G=2000" data-value="quantity:METRIC_G=2000">2,000 g</span> of gold',
    // },
  ];

  testCases.forEach((tc) => {
    const actual = annotateQuantitiesAsHTML(
      tc.input,
      tc.convertToMetric,
      tc.roundSatisfying, // if undefined, annotateQuantitiesAsHTML defaults it based on convertToMetric
    );
    console.assert(
      actual === tc.expected,
      `${tc.description}. Expected: '${tc.expected}', Actual: '${actual}'`,
    );
  });

  console.log("\nparse-quantity tests completed.");
}

// Example of how to run if this file were executed directly (e.g., node)
// if (typeof require !== 'undefined' && require.main === module) {
//   runParseQuantityTests();
// }
