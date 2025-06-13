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
    const expectedLiters = 2 * 0.23659; // Using the exact value from units.ts for US_CUP
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
    const expectedMl = expectedLiters * 1000; // Convert expected Liters to mL
    const toleranceMl = 0.005;
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
      input: "Mix 1/2 cup milk", // 0.5 US cups = 0.5 * 0.23659 L = 0.118295 L = 118.295 mL
      convertToMetric: true,
      roundSatisfying: false,
      expected:
        'Mix <span class="quantity" title="US_CUP=0.5" data-value="quantity:US_CUP=0.5">1/2 cup</span> <span class="quantity-metric" title="METRIC_ML=118.295" data-value="quantity:METRIC_ML=118.295">(118.295 ml)</span> milk',
    },
    {
      description:
        "Decimal US quantity, with metric conversion (default rounding)",
      input: "Use 1.5 tsp salt", // 1.5 tsp = 1.5 * 0.005 L = 0.0075 L = 7.5 mL
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
      // 1 US Cup (0.23659 L) -> 236.59 mL -> rounds to 235 ml
      // 0.5 lb (0.5 * 0.45359 kg) -> 0.226795 kg -> 226.795 g -> rounds to 225 g
      expected:
        'Take <span class="quantity" title="US_CUP=1" data-value="quantity:US_CUP=1">1 cup</span> <span class="quantity-metric" title="METRIC_ML=235" data-value="quantity:METRIC_ML=235">(235 ml)</span> sugar and <span class="quantity" title="US_LB=0.5" data-value="quantity:US_LB=0.5">1/2 lb</span> <span class="quantity-metric" title="METRIC_G=225" data-value="quantity:METRIC_G=225">(225 g)</span> butter',
    },
    {
      description: "Quantity with no space before unit, e.g. 2cups",
      input: "Add 2cups flour",
      convertToMetric: false,
      expected:
        'Add <span class="quantity" title="US_CUP=2" data-value="quantity:US_CUP=2">2cups</span> flour',
    },
    {
      description: "Unicode fraction ¼ cup, with metric conversion",
      input: "Add ¼ cup sugar", // 0.25 US_CUP = 0.25 * 0.23659 L = 0.0591475 L = 59.1475 mL, rounds to 59 ml
      convertToMetric: true,
      expected:
        'Add <span class="quantity" title="US_CUP=0.25" data-value="quantity:US_CUP=0.25">¼ cup</span> <span class="quantity-metric" title="METRIC_ML=59" data-value="quantity:METRIC_ML=59">(59 ml)</span> sugar',
    },
    // --- Temperature Tests ---
    {
      description:
        "Fahrenheit to Celsius (32F -> 0C), exact conversion, default rounding (satisfying)",
      input: "Water freezes at 32 F.",
      convertToMetric: true, // roundSatisfying defaults to true
      expected:
        'Water freezes at <span class="quantity" title="F=32" data-value="quantity:F=32">32 F</span> <span class="quantity-metric" title="C=0" data-value="quantity:C=0">(0°C)</span>.',
    },
    {
      description:
        "Fahrenheit to Celsius (32F -> 0.0C), exact conversion, no rounding",
      input: "Water freezes at 32°F.",
      convertToMetric: true,
      roundSatisfying: false,
      expected:
        'Water freezes at <span class="quantity" title="F=32" data-value="quantity:F=32">32°F</span> <span class="quantity-metric" title="C=0" data-value="quantity:C=0">(0.0°C)</span>.',
    },
    {
      description:
        "Fahrenheit to Celsius (212F -> 100C), exact conversion, default rounding",
      input: "Water boils at 212 °F.",
      convertToMetric: true,
      expected:
        'Water boils at <span class="quantity" title="F=212" data-value="quantity:F=212">212 °F</span> <span class="quantity-metric" title="C=100" data-value="quantity:C=100">(100°C)</span>.',
    },
    {
      description:
        "Fahrenheit to Celsius (70F -> 21.1C), decimal conversion, no rounding",
      input: "Average room temp is 70 F", // 70F = 21.111... C
      convertToMetric: true,
      roundSatisfying: false,
      expected:
        'Average room temp is <span class="quantity" title="F=70" data-value="quantity:F=70">70 F</span> <span class="quantity-metric" title="C=21.1" data-value="quantity:C=21.1">(21.1°C)</span>',
    },
    {
      description:
        "Fahrenheit to Celsius (70F -> 21C), decimal conversion, default (satisfying) rounding",
      input: "Warm room at 70°F", // 70F = 21.111... C, roundSatisfying -> 21
      convertToMetric: true,
      expected:
        'Warm room at <span class="quantity" title="F=70" data-value="quantity:F=70">70°F</span> <span class="quantity-metric" title="C=21" data-value="quantity:C=21">(21°C)</span>',
    },
    {
      description:
        "Fahrenheit to Celsius (68F -> 20C), exact decimal conversion, default rounding",
      input: "A cool day at 68F", // 68F = 20C exactly
      convertToMetric: true,
      expected:
        'A cool day at <span class="quantity" title="F=68" data-value="quantity:F=68">68F</span> <span class="quantity-metric" title="C=20" data-value="quantity:C=20">(20°C)</span>',
    },
    {
      description:
        "Fahrenheit to Celsius (69F -> 20.5C), non-exact decimal, explicit satisfying rounding",
      input: "A mild 69 Fahrenheit", // 69F = 20.555... C. roundSatisfying -> 20.5
      convertToMetric: true,
      roundSatisfying: true,
      expected:
        'A mild <span class="quantity" title="F=69" data-value="quantity:F=69">69 Fahrenheit</span> <span class="quantity-metric" title="C=20.5" data-value="quantity:C=20.5">(20.5°C)</span>',
    },
    {
      description:
        "Already Celsius, convertToMetric is true (no change, no metric span)",
      input: "Boil at 100 °C please.",
      convertToMetric: true,
      expected:
        'Boil at <span class="quantity" title="C=100" data-value="quantity:C=100">100 °C</span> please.',
    },
    {
      description: "Fahrenheit, convertToMetric is false (no change)",
      input: "It's 75F here.",
      convertToMetric: false,
      expected:
        'It\'s <span class="quantity" title="F=75" data-value="quantity:F=75">75F</span> here.',
    },
    {
      description: "Celsius, convertToMetric is false (no change)",
      input: "It's 22C here.",
      convertToMetric: false,
      expected:
        'It\'s <span class="quantity" title="C=22" data-value="quantity:C=22">22C</span> here.',
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
