import { annotateQuantitiesAsHTML } from "../src/parse-quantity";
import { getOptimalUnit, convertMeasurement, UNIT_DEFINITIONS } from "../src/units";

function testAnnotateQuantities() {
  // Test basic units (convertToMetric=false)
  let result = annotateQuantitiesAsHTML("2 cups", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=2" data-value="quantity:US-CUP=2">2 cups</span>',
    "Failed to annotate cups correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1 tsp", false);
  console.assert(
    result ===
      '<span class="quantity" title="TSP=1" data-value="quantity:TSP=1">1 tsp</span>',
    "Failed to annotate tsp correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("3 tbsp", false);
  console.assert(
    result ===
      '<span class="quantity" title="TBSP=3" data-value="quantity:TBSP=3">3 tbsp</span>',
    "Failed to annotate tbsp correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("250 ml", false);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=250" data-value="quantity:METRIC-ML=250">250 ml</span>',
    "Failed to annotate ml correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1.5 l", false);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=1.5" data-value="quantity:METRIC-L=1.5">1.5 l</span>',
    "Failed to annotate l correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("100 g", false);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=100" data-value="quantity:METRIC-G=100">100 g</span>',
    "Failed to annotate g correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("0.5 kg", false);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-KG=0.5" data-value="quantity:METRIC-KG=0.5">0.5 kg</span>',
    "Failed to annotate kg correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("8 oz", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-OZ=8" data-value="quantity:US-OZ=8">8 oz</span>',
    "Failed to annotate oz correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("2 lb", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-LB=2" data-value="quantity:US-LB=2">2 lb</span>',
    "Failed to annotate lb correctly (convertToMetric=false)",
  );

  // Test plural units (convertToMetric=false)
  result = annotateQuantitiesAsHTML("2 cups flour", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=2" data-value="quantity:US-CUP=2">2 cups</span> flour',
    "Failed to annotate plural cups correctly (convertToMetric=false)",
  );

  // Test fractions (convertToMetric=false)
  result = annotateQuantitiesAsHTML("1/2 cup milk", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=0.5" data-value="quantity:US-CUP=0.5">1/2 cup</span> milk',
    "Failed to annotate fractions correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1½ tsp salt", false);
  console.assert(
    result ===
      '<span class="quantity" title="TSP=1.5" data-value="quantity:TSP=1.5">1½ tsp</span> salt',
    "Failed to annotate unicode fractions correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("2 1/4 cups sugar", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=2.25" data-value="quantity:US-CUP=2.25">2 1/4 cups</span> sugar',
    "Failed to annotate mixed numbers correctly (convertToMetric=false)",
  );

  // Test singular forms (convertToMetric=false)
  result = annotateQuantitiesAsHTML("1 teaspoon vanilla", false);
  console.assert(
    result ===
      '<span class="quantity" title="TSP=1" data-value="quantity:TSP=1">1 teaspoon</span> vanilla',
    "Failed to annotate singular teaspoon correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1 tablespoon oil", false);
  console.assert(
    result ===
      '<span class="quantity" title="TBSP=1" data-value="quantity:TBSP=1">1 tablespoon</span> oil',
    "Failed to annotate singular tablespoon correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1 gram nutmeg", false);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=1" data-value="quantity:METRIC-G=1">1 gram</span> nutmeg',
    "Failed to annotate singular gram correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1 ounce chocolate", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-OZ=1" data-value="quantity:US-OZ=1">1 ounce</span> chocolate',
    "Failed to annotate singular ounce correctly (convertToMetric=false)",
  );

  // Test word boundary protection (should NOT match)
  result = annotateQuantitiesAsHTML("1 lemon", false);
  console.assert(
    result === "1 lemon",
    "Should not match 'l' in 'lemon' (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("8 garlic cloves", false);
  console.assert(
    result === "8 garlic cloves",
    "Should not match 'g' in 'garlic' (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("5 ozonic compounds", false);
  console.assert(
    result === "5 ozonic compounds",
    "Should not match 'oz' in 'ozonic' (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("put in cupboard", false);
  console.assert(
    result === "put in cupboard",
    "Should not match 'cup' in 'cupboard' (convertToMetric=false)",
  );

  // Test no match
  result = annotateQuantitiesAsHTML("some words", false);
  console.assert(
    result === "some words",
    "Should return original string if not match (convertToMetric=false)",
  );
}

function testAnnotateQuantitiesWithMetricConversion() {
  // Test basic units (convertToMetric=true, shouldRoundSatisfying=true)
  let result = annotateQuantitiesAsHTML("2 cups", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=475" data-value="quantity:METRIC-ML=475">2 cups (475 ml)</span>',
    `Failed to annotate cups with optimal metric conversion: ${result}`,
  );

  result = annotateQuantitiesAsHTML("1 tsp", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=5" data-value="quantity:METRIC-ML=5">1 tsp (5 ml)</span>',
    `Failed to annotate tsp with optimal metric conversion: ${result}`,
  );

  result = annotateQuantitiesAsHTML("3 tbsp", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=45" data-value="quantity:METRIC-ML=45">3 tbsp (45 ml)</span>',
    "Failed to annotate tbsp with optimal metric conversion",
  );

  result = annotateQuantitiesAsHTML("250 ml", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=250" data-value="quantity:METRIC-ML=250">250 ml</span>',
    "Failed to annotate ml with optimal metric conversion",
  );

  result = annotateQuantitiesAsHTML("1.5 l", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=1.5" data-value="quantity:METRIC-L=1.5">1.5 l</span>',
    "Failed to annotate l with optimal metric conversion",
  );

  result = annotateQuantitiesAsHTML("100 g", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=100" data-value="quantity:METRIC-G=100">100 g</span>',
    "Failed to annotate g with optimal metric conversion",
  );

  result = annotateQuantitiesAsHTML("0.5 kg", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-KG=0.5" data-value="quantity:METRIC-KG=0.5">0.5 kg</span>',
    "Failed to annotate kg with optimal metric conversion",
  );

  result = annotateQuantitiesAsHTML("8 oz", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=225" data-value="quantity:METRIC-G=225">8 oz (225 g)</span>',
    "Failed to annotate oz with optimal metric conversion",
  );

  result = annotateQuantitiesAsHTML("2 lb", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=905" data-value="quantity:METRIC-G=905">2 lb (905 g)</span>',
    "Failed to annotate lb with optimal metric conversion",
  );

  // Test plural units (convertToMetric=true)
  result = annotateQuantitiesAsHTML("2 cups flour", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=475" data-value="quantity:METRIC-ML=475">2 cups (475 ml)</span> flour',
    "Failed to annotate plural cups with optimal metric conversion",
  );

  // Test fractions (convertToMetric=true)
  result = annotateQuantitiesAsHTML("1/2 cup milk", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=120" data-value="quantity:METRIC-ML=120">1/2 cup (120 ml)</span> milk',
    "Failed to annotate fractions with optimal metric conversion",
  );

  result = annotateQuantitiesAsHTML("1½ tsp salt", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=7.5" data-value="quantity:METRIC-ML=7.5">1½ tsp (7.5 ml)</span> salt',
    "Failed to annotate unicode fractions with optimal metric conversion",
  );

  result = annotateQuantitiesAsHTML("2 1/4 cups sugar", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=530" data-value="quantity:METRIC-ML=530">2 1/4 cups (530 ml)</span> sugar',
    "Failed to annotate mixed numbers with optimal metric conversion",
  );

  // Test singular forms (convertToMetric=true)
  result = annotateQuantitiesAsHTML("1 teaspoon vanilla", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=5" data-value="quantity:METRIC-ML=5">1 teaspoon (5 ml)</span> vanilla',
    "Failed to annotate singular teaspoon with optimal metric conversion",
  );

  result = annotateQuantitiesAsHTML("1 tablespoon oil", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=15" data-value="quantity:METRIC-ML=15">1 tablespoon (15 ml)</span> oil',
    "Failed to annotate singular tablespoon with optimal metric conversion",
  );

  result = annotateQuantitiesAsHTML("1 gram nutmeg", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=1" data-value="quantity:METRIC-G=1">1 gram</span> nutmeg',
    "Failed to annotate singular gram with optimal metric conversion",
  );

  result = annotateQuantitiesAsHTML("1 ounce chocolate", true, true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=28.5" data-value="quantity:METRIC-G=28.5">1 ounce (28.5 g)</span> chocolate',
    "Failed to annotate singular ounce with optimal metric conversion",
  );

  // Test word boundary protection (should NOT match)
  result = annotateQuantitiesAsHTML("1 lemon", true, true);
  console.assert(
    result === "1 lemon",
    "Should not match 'l' in 'lemon' (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("8 garlic cloves", true, true);
  console.assert(
    result === "8 garlic cloves",
    "Should not match 'g' in 'garlic' (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("5 ozonic compounds", true, true);
  console.assert(
    result === "5 ozonic compounds",
    "Should not match 'oz' in 'ozonic' (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("put in cupboard", true, true);
  console.assert(
    result === "put in cupboard",
    "Should not match 'cup' in 'cupboard' (convertToMetric=true)",
  );

  // Test no match
  result = annotateQuantitiesAsHTML("some words", true);
  console.assert(
    result === "some words",
    "Should return original string if not match (convertToMetric=true)",
  );
}

function testOptimalUnitSelection() {
  // Test optimal unit selection for volume
  let optimalUnit = getOptimalUnit(0.5, UNIT_DEFINITIONS.find(u => u.key === "METRIC_L")!, "METRIC");
  console.assert(
    optimalUnit.key === "METRIC_ML",
    "Should choose ml for 0.5L (500ml)",
  );

  optimalUnit = getOptimalUnit(1.5, UNIT_DEFINITIONS.find(u => u.key === "METRIC_L")!, "METRIC");
  console.assert(optimalUnit.key === "METRIC_L", "Should choose L for 1.5L");

  optimalUnit = getOptimalUnit(0.1, UNIT_DEFINITIONS.find(u => u.key === "METRIC_KG")!, "METRIC");
  console.assert(
    optimalUnit.key === "METRIC_G",
    "Should choose g for 0.1kg (100g)",
  );

  optimalUnit = getOptimalUnit(2, UNIT_DEFINITIONS.find(u => u.key === "METRIC_KG")!, "METRIC");
  console.assert(optimalUnit.key === "METRIC_KG", "Should choose kg for 2kg");

  // Test that TSP and TBSP are preserved
  optimalUnit = getOptimalUnit(0.5, UNIT_DEFINITIONS.find(u => u.key === "TSP")!, "METRIC");
  console.assert(optimalUnit.key === "TSP", "Should preserve TSP units");

  optimalUnit = getOptimalUnit(2, UNIT_DEFINITIONS.find(u => u.key === "TBSP")!, "METRIC");
  console.assert(optimalUnit.key === "TBSP", "Should preserve TBSP units");
}

function testConvertMeasurement() {
  // Test volume conversions
  let [value, unit] = convertMeasurement(1, UNIT_DEFINITIONS.find(u => u.key === "US_CUP")!, UNIT_DEFINITIONS.find(u => u.key === "METRIC_ML")!);
  console.assert(
    Math.abs(value - 236.59) < 0.01,
    "Should convert 1 cup to ~236.59 ml",
  );

  [value, unit] = convertMeasurement(1000, UNIT_DEFINITIONS.find(u => u.key === "METRIC_ML")!, UNIT_DEFINITIONS.find(u => u.key === "METRIC_L")!);
  console.assert(value === 1, "Should convert 1000 ml to 1 L");

  // Test mass conversions
  [value, unit] = convertMeasurement(1, UNIT_DEFINITIONS.find(u => u.key === "US_LB")!, UNIT_DEFINITIONS.find(u => u.key === "METRIC_G")!);
  console.assert(
    Math.abs(value - 453.59) < 0.01,
    "Should convert 1 lb to ~453.59 g",
  );

  [value, unit] = convertMeasurement(1000, UNIT_DEFINITIONS.find(u => u.key === "METRIC_G")!, UNIT_DEFINITIONS.find(u => u.key === "METRIC_KG")!);
  console.assert(value === 1, "Should convert 1000 g to 1 kg");
}

function testRoundingSatisfyingFlag() {
  // Test that shouldRoundSatisfying flag works correctly
  let resultWithRounding = annotateQuantitiesAsHTML("2 cups", true, true);
  console.assert(
    resultWithRounding ===
      '<span class="quantity" title="METRIC-ML=475" data-value="quantity:METRIC-ML=475">2 cups (475 ml)</span>',
    "Should use rounded values when shouldRoundSatisfying=true (default)",
  );

  let resultWithoutRounding = annotateQuantitiesAsHTML("2 cups", true, false);
  console.assert(
    resultWithoutRounding ===
      '<span class="quantity" title="METRIC-ML=473.18" data-value="quantity:METRIC-ML=473.18">2 cups (473.18 ml)</span>',
    "Should use precise values when shouldRoundSatisfying=false",
  );

  // Test with fractions
  resultWithRounding = annotateQuantitiesAsHTML("1/2 cup milk", true, true);
  console.assert(
    resultWithRounding ===
      '<span class="quantity" title="METRIC-ML=120" data-value="quantity:METRIC-ML=120">1/2 cup (120 ml)</span> milk',
    "Should round fractions when shouldRoundSatisfying=true",
  );

  resultWithoutRounding = annotateQuantitiesAsHTML("1/2 cup milk", true, false);
  console.assert(
    resultWithoutRounding ===
      '<span class="quantity" title="METRIC-ML=118.295" data-value="quantity:METRIC-ML=118.295">1/2 cup (118.295 ml)</span> milk',
    "Should not round fractions when shouldRoundSatisfying=false",
  );
}

export function runParseQuantityTests() {
  testAnnotateQuantities();
  testAnnotateQuantitiesWithMetricConversion();
  testOptimalUnitSelection();
  testConvertMeasurement();
  testRoundingSatisfyingFlag();

  console.log("parse-quantity tests completed.");
}
