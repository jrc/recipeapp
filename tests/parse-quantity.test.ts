import { renderQuantities } from "../src/parse-quantity";

function testAnnotateQuantities() {
  console.log("Testing renderQuantities...");

  // Test basic units
  let result = renderQuantities("2 cups");
  console.assert(
    result === '<a href="quantity:US_CUP=2">2 cups</a>',
    "Should annotate cups correctly",
  );

  result = renderQuantities("1 tsp");
  console.assert(
    result === '<a href="quantity:US_TSP=1">1 tsp</a>',
    "Should annotate tsp correctly",
  );

  result = renderQuantities("3 tbsp");
  console.assert(
    result === '<a href="quantity:US_TBSP=3">3 tbsp</a>',
    "Should annotate tbsp correctly",
  );

  result = renderQuantities("250 ml");
  console.assert(
    result === '<a href="quantity:METRIC_ML=250">250 ml</a>',
    "Should annotate ml correctly",
  );

  result = renderQuantities("1.5 l");
  console.assert(
    result === '<a href="quantity:METRIC_L=1.5">1.5 l</a>',
    "Should annotate l correctly",
  );

  result = renderQuantities("100 g");
  console.assert(
    result === '<a href="quantity:METRIC_G=100">100 g</a>',
    "Should annotate g correctly",
  );

  result = renderQuantities("0.5 kg");
  console.assert(
    result === '<a href="quantity:METRIC_KG=0.5">0.5 kg</a>',
    "Should annotate kg correctly",
  );

  result = renderQuantities("8 oz");
  console.assert(
    result === '<a href="quantity:US_OZ=8">8 oz</a>',
    "Should annotate oz correctly",
  );

  result = renderQuantities("2 lb");
  console.assert(
    result === '<a href="quantity:US_LB=2">2 lb</a>',
    "Should annotate lb correctly",
  );

  // Test plural units
  result = renderQuantities("2 cups flour");
  console.assert(
    result === '<a href="quantity:US_CUP=2">2 cups</a> flour',
    "Should annotate plural cups correctly",
  );

  // Test no match
  result = renderQuantities("some words");
  console.assert(
    result === "some words",
    "Should return original string if not match",
  );

  console.log("✓ renderQuantities tests passed");
}

export function runParseQuantityTests() {
  testAnnotateQuantities();
}
