import { annotateQuantities } from "../src/parse-quantity";

function testAnnotateQuantities() {
  console.log("Testing annotateQuantities...");

  // Test basic units
  let result = annotateQuantities("2 cups");
  console.assert(
    result === "[2 cups](quantity:US_CUP=2)",
    "Should annotate cups correctly",
  );

  result = annotateQuantities("1 tsp");
  console.assert(
    result === "[1 tsp](quantity:US_TSP=1)",
    "Should annotate tsp correctly",
  );

  result = annotateQuantities("3 tbsp");
  console.assert(
    result === "[3 tbsp](quantity:US_TBSP=3)",
    "Should annotate tbsp correctly",
  );

  result = annotateQuantities("250 ml");
  console.assert(
    result === "[250 ml](quantity:METRIC_ML=250)",
    "Should annotate ml correctly",
  );

  result = annotateQuantities("1.5 l");
  console.assert(
    result === "[1.5 l](quantity:METRIC_L=1.5)",
    "Should annotate l correctly",
  );

  result = annotateQuantities("100 g");
  console.assert(
    result === "[100 g](quantity:METRIC_G=100)",
    "Should annotate g correctly",
  );

  result = annotateQuantities("0.5 kg");
  console.assert(
    result === "[0.5 kg](quantity:METRIC_KG=0.5)",
    "Should annotate kg correctly",
  );

  result = annotateQuantities("8 oz");
  console.assert(
    result === "[8 oz](quantity:US_OZ=8)",
    "Should annotate oz correctly",
  );

  result = annotateQuantities("2 lb");
  console.assert(
    result === "[2 lb](quantity:US_LB=2)",
    "Should annotate lb correctly",
  );

  // Test plural units
  result = annotateQuantities("2 cups flour");
  console.assert(
    result === "[2 cups](quantity:US_CUP=2) flour",
    "Should annotate plural cups correctly",
  );

  // Test no match
  result = annotateQuantities("some words");
  console.assert(
    result === "some words",
    "Should return original string if not match",
  );

  console.log("✓ annotateQuantities tests passed");
}

export function runParseQuantityTests() {
  testAnnotateQuantities();
}
