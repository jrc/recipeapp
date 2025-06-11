import { annotateQuantitiesAsHTML } from "../src/parse-quantity";
import { getOptimalUnit, convertMeasurement } from "../src/units";

function testAnnotateQuantities() {
  // Test basic units (convertToMetric=false)
  let result = annotateQuantitiesAsHTML("2 cups", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=2" data-value="quantity:US-CUP=2">2 cups</span>',
    "Should annotate cups correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1 tsp", false);
  console.assert(
    result ===
      '<span class="quantity" title="TSP=1" data-value="quantity:TSP=1">1 tsp</span>',
    "Should annotate tsp correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("3 tbsp", false);
  console.assert(
    result ===
      '<span class="quantity" title="TBSP=3" data-value="quantity:TBSP=3">3 tbsp</span>',
    "Should annotate tbsp correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("250 ml", false);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=250" data-value="quantity:METRIC-ML=250">250 ml</span>',
    "Should annotate ml correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1.5 l", false);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=1.5" data-value="quantity:METRIC-L=1.5">1.5 l</span>',
    "Should annotate l correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("100 g", false);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=100" data-value="quantity:METRIC-G=100">100 g</span>',
    "Should annotate g correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("0.5 kg", false);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-KG=0.5" data-value="quantity:METRIC-KG=0.5">0.5 kg</span>',
    "Should annotate kg correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("8 oz", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-OZ=8" data-value="quantity:US-OZ=8">8 oz</span>',
    "Should annotate oz correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("2 lb", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-LB=2" data-value="quantity:US-LB=2">2 lb</span>',
    "Should annotate lb correctly (convertToMetric=false)",
  );

  // Test plural units (convertToMetric=false)
  result = annotateQuantitiesAsHTML("2 cups flour", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=2" data-value="quantity:US-CUP=2">2 cups</span> flour',
    "Should annotate plural cups correctly (convertToMetric=false)",
  );

  // Test fractions (convertToMetric=false)
  result = annotateQuantitiesAsHTML("1/2 cup milk", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=0.5" data-value="quantity:US-CUP=0.5">1/2 cup</span> milk',
    "Should annotate fractions correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1½ tsp salt", false);
  console.assert(
    result ===
      '<span class="quantity" title="TSP=1.5" data-value="quantity:TSP=1.5">1½ tsp</span> salt',
    "Should annotate unicode fractions correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("2 1/4 cups sugar", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=2.25" data-value="quantity:US-CUP=2.25">2 1/4 cups</span> sugar',
    "Should annotate mixed numbers correctly (convertToMetric=false)",
  );

  // Test singular forms (convertToMetric=false)
  result = annotateQuantitiesAsHTML("1 teaspoon vanilla", false);
  console.assert(
    result ===
      '<span class="quantity" title="TSP=1" data-value="quantity:TSP=1">1 teaspoon</span> vanilla',
    "Should annotate singular teaspoon correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1 tablespoon oil", false);
  console.assert(
    result ===
      '<span class="quantity" title="TBSP=1" data-value="quantity:TBSP=1">1 tablespoon</span> oil',
    "Should annotate singular tablespoon correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1 gram nutmeg", false);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=1" data-value="quantity:METRIC-G=1">1 gram</span> nutmeg',
    "Should annotate singular gram correctly (convertToMetric=false)",
  );

  result = annotateQuantitiesAsHTML("1 ounce chocolate", false);
  console.assert(
    result ===
      '<span class="quantity" title="US-OZ=1" data-value="quantity:US-OZ=1">1 ounce</span> chocolate',
    "Should annotate singular ounce correctly (convertToMetric=false)",
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
  // Test basic units (convertToMetric=true) - now uses optimal units with rounding
  let result = annotateQuantitiesAsHTML("2 cups", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=475" data-value="quantity:METRIC-ML=475">2 cups</span>',
    "Should annotate cups correctly with optimal metric unit (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("1 tsp", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=4.95" data-value="quantity:METRIC-ML=4.95">1 tsp</span>',
    "Should annotate tsp correctly with optimal metric unit (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("3 tbsp", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=44.5" data-value="quantity:METRIC-ML=44.5">3 tbsp</span>',
    "Should annotate tbsp correctly with optimal metric unit (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("250 ml", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=250" data-value="quantity:METRIC-ML=250">250 ml</span>',
    "Should annotate ml correctly (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("1.5 l", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=1.5" data-value="quantity:METRIC-L=1.5">1.5 l</span>',
    "Should annotate l correctly (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("100 g", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=100" data-value="quantity:METRIC-G=100">100 g</span>',
    "Should annotate g correctly (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("0.5 kg", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-KG=0.5" data-value="quantity:METRIC-KG=0.5">0.5 kg</span>',
    "Should annotate kg correctly (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("8 oz", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=225" data-value="quantity:METRIC-G=225">8 oz</span>',
    "Should annotate oz correctly with optimal metric unit (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("2 lb", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=905" data-value="quantity:METRIC-G=905">2 lb</span>',
    "Should annotate lb correctly with optimal metric unit (convertToMetric=true)",
  );

  // Test plural units (convertToMetric=true)
  result = annotateQuantitiesAsHTML("2 cups flour", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=475" data-value="quantity:METRIC-ML=475">2 cups</span> flour',
    "Should annotate plural cups correctly with optimal metric unit (convertToMetric=true)",
  );

  // Test fractions (convertToMetric=true)
  result = annotateQuantitiesAsHTML("1/2 cup milk", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=120" data-value="quantity:METRIC-ML=120">1/2 cup</span> milk',
    "Should annotate fractions correctly with optimal metric unit (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("1½ tsp salt", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=7.4" data-value="quantity:METRIC-ML=7.4">1½ tsp</span> salt',
    "Should annotate unicode fractions correctly with optimal metric unit (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("2 1/4 cups sugar", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=530" data-value="quantity:METRIC-ML=530">2 1/4 cups</span> sugar',
    "Should annotate mixed numbers correctly with optimal metric unit (convertToMetric=true)",
  );

  // Test singular forms (convertToMetric=true)
  result = annotateQuantitiesAsHTML("1 teaspoon vanilla", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=4.95" data-value="quantity:METRIC-ML=4.95">1 teaspoon</span> vanilla',
    "Should annotate singular teaspoon correctly with optimal metric unit (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("1 tablespoon oil", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=15" data-value="quantity:METRIC-ML=15">1 tablespoon</span> oil',
    "Should annotate singular tablespoon correctly with optimal metric unit (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("1 gram nutmeg", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=1" data-value="quantity:METRIC-G=1">1 gram</span> nutmeg',
    "Should annotate singular gram correctly (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("1 ounce chocolate", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=28.5" data-value="quantity:METRIC-G=28.5">1 ounce</span> chocolate',
    "Should annotate singular ounce correctly with optimal metric unit (convertToMetric=true)",
  );

  // Test word boundary protection (should NOT match)
  result = annotateQuantitiesAsHTML("1 lemon", true);
  console.assert(
    result === "1 lemon",
    "Should not match 'l' in 'lemon' (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("8 garlic cloves", true);
  console.assert(
    result === "8 garlic cloves",
    "Should not match 'g' in 'garlic' (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("5 ozonic compounds", true);
  console.assert(
    result === "5 ozonic compounds",
    "Should not match 'oz' in 'ozonic' (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("put in cupboard", true);
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
  let optimalUnit = getOptimalUnit(0.5, "METRIC_L", "METRIC");
  console.assert(
    optimalUnit === "METRIC_ML",
    "Should choose ml for 0.5L (500ml)",
  );

  optimalUnit = getOptimalUnit(1.5, "METRIC_L", "METRIC");
  console.assert(
    optimalUnit === "METRIC_L",
    "Should choose L for 1.5L",
  );

  optimalUnit = getOptimalUnit(0.1, "METRIC_KG", "METRIC");
  console.assert(
    optimalUnit === "METRIC_G",
    "Should choose g for 0.1kg (100g)",
  );

  optimalUnit = getOptimalUnit(2, "METRIC_KG", "METRIC");
  console.assert(
    optimalUnit === "METRIC_KG",
    "Should choose kg for 2kg",
  );

  // Test that TSP and TBSP are preserved
  optimalUnit = getOptimalUnit(0.5, "TSP", "METRIC");
  console.assert(
    optimalUnit === "TSP",
    "Should preserve TSP units",
  );

  optimalUnit = getOptimalUnit(2, "TBSP", "METRIC");
  console.assert(
    optimalUnit === "TBSP",
    "Should preserve TBSP units",
  );
}

function testConvertMeasurement() {
  // Test volume conversions
  let [value, unit] = convertMeasurement(1, "US_CUP", "METRIC_ML");
  console.assert(
    Math.abs(value - 236.59) < 0.01,
    "Should convert 1 cup to ~236.59 ml",
  );

  [value, unit] = convertMeasurement(1000, "METRIC_ML", "METRIC_L");
  console.assert(
    value === 1,
    "Should convert 1000 ml to 1 L",
  );

  // Test mass conversions
  [value, unit] = convertMeasurement(1, "US_LB", "METRIC_G");
  console.assert(
    Math.abs(value - 453.59) < 0.01,
    "Should convert 1 lb to ~453.59 g",
  );

  [value, unit] = convertMeasurement(1000, "METRIC_G", "METRIC_KG");
  console.assert(
    value === 1,
    "Should convert 1000 g to 1 kg",
  );
}

function testRoundingSatisfyingFlag() {
  // Test that shouldRoundSatisfying flag works correctly
  let resultWithRounding = annotateQuantitiesAsHTML("2 cups", true, true);
  console.assert(
    resultWithRounding ===
      '<span class="quantity" title="METRIC-ML=475" data-value="quantity:METRIC-ML=475">2 cups</span>',
    "Should use rounded values when shouldRoundSatisfying=true (default)",
  );

  let resultWithoutRounding = annotateQuantitiesAsHTML("2 cups", true, false);
  console.assert(
    resultWithoutRounding ===
      '<span class="quantity" title="METRIC-ML=473.18" data-value="quantity:METRIC-ML=473.18">2 cups</span>',
    "Should use precise values when shouldRoundSatisfying=false",
  );

  // Test with fractions
  resultWithRounding = annotateQuantitiesAsHTML("1/2 cup milk", true, true);
  console.assert(
    resultWithRounding ===
      '<span class="quantity" title="METRIC-ML=120" data-value="quantity:METRIC-ML=120">1/2 cup</span> milk',
    "Should round fractions when shouldRoundSatisfying=true",
  );

  resultWithoutRounding = annotateQuantitiesAsHTML("1/2 cup milk", true, false);
  console.assert(
    resultWithoutRounding ===
      '<span class="quantity" title="METRIC-ML=118.295" data-value="quantity:METRIC-ML=118.295">1/2 cup</span> milk',
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
