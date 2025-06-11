import { annotateQuantities } from "../src/parse-quantity";

function testAnnotateQuantities() {
  console.log("Testing annotateQuantities...");

  // Test basic units
  let result = annotateQuantities("2 cups");
  console.assert(
    result === '<a href="quantity:US_CUP=2">2 cups</a>',
    "Should annotate cups correctly",
  );

  result = annotateQuantities("1 tsp");
  console.assert(
    result === '<a href="quantity:US_TSP=1">1 tsp</a>',
    "Should annotate tsp correctly",
  );

  result = annotateQuantities("3 tbsp");
  console.assert(
    result === '<a href="quantity:US_TBSP=3">3 tbsp</a>',
    "Should annotate tbsp correctly",
  );

  result = annotateQuantities("250 ml");
  console.assert(
    result === '<a href="quantity:METRIC_ML=250">250 ml</a>',
    "Should annotate ml correctly",
  );

  result = annotateQuantities("1.5 l");
  console.assert(
    result === '<a href="quantity:METRIC_L=1.5">1.5 l</a>',
    "Should annotate l correctly",
  );

  result = annotateQuantities("100 g");
  console.assert(
    result === '<a href="quantity:METRIC_G=100">100 g</a>',
    "Should annotate g correctly",
  );

  result = annotateQuantities("0.5 kg");
  console.assert(
    result === '<a href="quantity:METRIC_KG=0.5">0.5 kg</a>',
    "Should annotate kg correctly",
  );

  result = annotateQuantities("8 oz");
  console.assert(
    result === '<a href="quantity:US_OZ=8">8 oz</a>',
    "Should annotate oz correctly",
  );

  result = annotateQuantities("2 lb");
  console.assert(
    result === '<a href="quantity:US_LB=2">2 lb</a>',
    "Should annotate lb correctly",
  );

  // Test plural units
  result = annotateQuantities("2 cups flour");
  console.assert(
    result === '<a href="quantity:US_CUP=2">2 cups</a> flour',
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
