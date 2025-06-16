import { annotateQuantitiesAsHTML } from "../src/parse-quantity.js";
import {
  getOptimalUnit,
  convertMeasurement,
  UNIT_DEFINITIONS,
  UnitDefinition,
} from "../src/units.js";

export function runParseQuantityTests() {
  // --- Demonstrating correct usage of convertMeasurement and getOptimalUnit ---
  let usCupDef: UnitDefinition | undefined;
  let metricLiterDef: UnitDefinition | undefined;
  let metricMlDef: UnitDefinition | undefined;

  if (Array.isArray(UNIT_DEFINITIONS)) {
    usCupDef = UNIT_DEFINITIONS.find((u) => u && u.key === "US_CUP");
    metricLiterDef = UNIT_DEFINITIONS.find((u) => u && u.key === "METRIC_L");
    metricMlDef = UNIT_DEFINITIONS.find((u) => u && u.key === "METRIC_ML");
  } else {
    console.error(
      "Critical: UNIT_DEFINITIONS is not an array. Skipping unit definition dependent tests.",
    );
  }

  if (!usCupDef || !metricLiterDef || !metricMlDef) {
    console.error(
      "Critical: Required unit definitions (US_CUP, METRIC_L, METRIC_ML) not found or UNIT_DEFINITIONS was invalid. Skipping some unit conversion tests.",
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
      // roundSatisfying(118.295, 0.05) -> 120 ml
      expected:
        'Mix <span class="quantity" title="US_CUP=0.5" data-value="quantity:US_CUP=0.5">1/2 cup</span> <span class="quantity-metric" title="METRIC_ML=120" data-value="quantity:METRIC_ML=120">(120 ml)</span> milk',
    },
    {
      description:
        "Fractional US quantity, with metric conversion, no rounding",
      input: "Mix 1/2 cup milk",
      convertToMetric: true,
      roundSatisfying: false,
      expected:
        'Mix <span class="quantity" title="US_CUP=0.5" data-value="quantity:US_CUP=0.5">1/2 cup</span> <span class="quantity-metric" title="METRIC_ML=118.295" data-value="quantity:METRIC_ML=118.295">(118.295 ml)</span> milk',
    },
    {
      description:
        "Decimal US quantity, with metric conversion (default rounding)",
      input: "Use 1.5 tsp salt",
      convertToMetric: true,
      // roundSatisfying(7.39338, 0.05) -> 7.5 ml
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
      // 1 US Cup (236.588 mL) -> roundSatisfying(236.588, 0.05) -> 225 ml
      // 0.5 lb (226.796 g) -> roundSatisfying(226.796, 0.05) -> 225 g
      expected:
        'Take <span class="quantity" title="US_CUP=1" data-value="quantity:US_CUP=1">1 cup</span> <span class="quantity-metric" title="METRIC_ML=225" data-value="quantity:METRIC_ML=225">(225 ml)</span> sugar and <span class="quantity" title="US_LB=0.5" data-value="quantity:US_LB=0.5">1/2 lb</span> <span class="quantity-metric" title="METRIC_G=225" data-value="quantity:METRIC_G=225">(225 g)</span> butter',
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
      input: "Add ¼ cup sugar",
      convertToMetric: true,
      // 0.25 US_CUP = 59.147 mL. roundSatisfying(59.147, 0.05) -> 60 ml
      expected:
        'Add <span class="quantity" title="US_CUP=0.25" data-value="quantity:US_CUP=0.25">¼ cup</span> <span class="quantity-metric" title="METRIC_ML=60" data-value="quantity:METRIC_ML=60">(60 ml)</span> sugar',
    },
    // --- Temperature Tests ---
    {
      description:
        "Fahrenheit to Celsius (32F -> 0C), exact conversion, default rounding (satisfying)",
      input: "Water freezes at 32 F.",
      convertToMetric: true,
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
      input: "Average room temp is 70 F",
      convertToMetric: true,
      roundSatisfying: false,
      expected:
        'Average room temp is <span class="quantity" title="F=70" data-value="quantity:F=70">70 F</span> <span class="quantity-metric" title="C=21.1" data-value="quantity:C=21.1">(21.1°C)</span>',
    },
    {
      description:
        "Fahrenheit to Celsius (70F -> 21C), decimal conversion, default (satisfying) rounding",
      input: "Warm room at 70°F",
      convertToMetric: true,
      // 70F = 21.111... C, roundSatisfying(21.111...) -> 21C
      expected:
        'Warm room at <span class="quantity" title="F=70" data-value="quantity:F=70">70°F</span> <span class="quantity-metric" title="C=21" data-value="quantity:C=21">(21°C)</span>',
    },
    {
      description:
        "Fahrenheit to Celsius (68F -> 20C), exact decimal conversion, default rounding",
      input: "A cool day at 68F",
      convertToMetric: true,
      expected:
        'A cool day at <span class="quantity" title="F=68" data-value="quantity:F=68">68F</span> <span class="quantity-metric" title="C=20" data-value="quantity:C=20">(20°C)</span>',
    },
    {
      description:
        "Fahrenheit to Celsius (69F -> 20C), non-exact decimal, explicit satisfying rounding",
      input: "A mild 69 Fahrenheit",
      convertToMetric: true,
      roundSatisfying: true,
      // 69F = 20.555... C. roundSatisfying(20.555..., 0.05) -> 20C
      expected:
        'A mild <span class="quantity" title="F=69" data-value="quantity:F=69">69 Fahrenheit</span> <span class="quantity-metric" title="C=20" data-value="quantity:C=20">(20°C)</span>',
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
    // Unicode fractions in numbers, e.g. "1¾"
    {
      description: "Mixed unicode fraction 1¾ cups, metric conversion",
      input: "Add 1¾ cups flour.",
      convertToMetric: true,
      // 1.75 US_CUP = 414.029 mL. roundSatisfying(414.029, 0.05) -> 400 mL
      expected:
        'Add <span class="quantity" title="US_CUP=1.75" data-value="quantity:US_CUP=1.75">1¾ cups</span> <span class="quantity-metric" title="METRIC_ML=400" data-value="quantity:METRIC_ML=400">(400 ml)</span> flour.',
    },
    // Test for 'fl oz' vs 'oz'
    {
      description: "Fluid ounces (fl oz) vs ounces (oz) mass",
      input: "Need 8 fl oz water and 2 oz nuts.",
      convertToMetric: true,
      // 8 fl oz (US_FLOZ) = 236.588 mL -> roundSatisfying -> 225 mL
      // 2 oz (US_OZ) = 56.699 g -> roundSatisfying(56.699, 0.05) -> 55 g
      expected:
        'Need <span class="quantity" title="US_FLOZ=8" data-value="quantity:US_FLOZ=8">8 fl oz</span> <span class="quantity-metric" title="METRIC_ML=225" data-value="quantity:METRIC_ML=225">(225 ml)</span> water and <span class="quantity" title="US_OZ=2" data-value="quantity:US_OZ=2">2 oz</span> <span class="quantity-metric" title="METRIC_G=55" data-value="quantity:METRIC_G=55">(55 g)</span> nuts.',
    },
  ];

  testCases.forEach((tc) => {
    const actual = annotateQuantitiesAsHTML(
      tc.input,
      tc.convertToMetric,
      tc.roundSatisfying,
    );
    console.assert(
      actual === tc.expected,
      `${tc.description}. Expected: '${tc.expected}', Actual: '${actual}'`,
    );
  });

  console.log("\nparse-quantity tests completed.");
}
