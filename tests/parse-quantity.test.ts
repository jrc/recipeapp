import { annotateQuantitiesAsHTML } from "../src/parse-quantity";

function testAnnotateQuantities() {
  console.log("Testing annotateQuantitiesAsHTML...");

  // Test basic units
  let result = annotateQuantitiesAsHTML("2 cups");
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=2" data-value="quantity:US-CUP=2">2 cups</span>',
    "Should annotate cups correctly",
  );

  result = annotateQuantitiesAsHTML("1 tsp");
  console.assert(
    result ===
      '<span class="quantity" title="US-TSP=1" data-value="quantity:US-TSP=1">1 tsp</span>',
    "Should annotate tsp correctly",
  );

  result = annotateQuantitiesAsHTML("3 tbsp");
  console.assert(
    result ===
      '<span class="quantity" title="US-TBSP=3" data-value="quantity:US-TBSP=3">3 tbsp</span>',
    "Should annotate tbsp correctly",
  );

  result = annotateQuantitiesAsHTML("250 ml");
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-ML=250" data-value="quantity:METRIC-ML=250">250 ml</span>',
    "Should annotate ml correctly",
  );

  result = annotateQuantitiesAsHTML("1.5 l");
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=1.5" data-value="quantity:METRIC-L=1.5">1.5 l</span>',
    "Should annotate l correctly",
  );

  result = annotateQuantitiesAsHTML("100 g");
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=100" data-value="quantity:METRIC-G=100">100 g</span>',
    "Should annotate g correctly",
  );

  result = annotateQuantitiesAsHTML("0.5 kg");
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-KG=0.5" data-value="quantity:METRIC-KG=0.5">0.5 kg</span>',
    "Should annotate kg correctly",
  );

  result = annotateQuantitiesAsHTML("8 oz");
  console.assert(
    result ===
      '<span class="quantity" title="US-OZ=8" data-value="quantity:US-OZ=8">8 oz</span>',
    "Should annotate oz correctly",
  );

  result = annotateQuantitiesAsHTML("2 lb");
  console.assert(
    result ===
      '<span class="quantity" title="US-LB=2" data-value="quantity:US-LB=2">2 lb</span>',
    "Should annotate lb correctly",
  );

  // Test plural units
  result = annotateQuantitiesAsHTML("2 cups flour");
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=2" data-value="quantity:US-CUP=2">2 cups</span> flour',
    "Should annotate plural cups correctly",
  );

  // Test fractions
  result = annotateQuantitiesAsHTML("1/2 cup milk");
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=0.5" data-value="quantity:US-CUP=0.5">1/2 cup</span> milk',
    "Should annotate fractions correctly",
  );

  result = annotateQuantitiesAsHTML("1½ tsp salt");
  console.assert(
    result ===
      '<span class="quantity" title="US-TSP=1.5" data-value="quantity:US-TSP=1.5">1½ tsp</span> salt',
    "Should annotate unicode fractions correctly",
  );

  result = annotateQuantitiesAsHTML("2 1/4 cups sugar");
  console.assert(
    result ===
      '<span class="quantity" title="US-CUP=2.25" data-value="quantity:US-CUP=2.25">2 1/4 cups</span> sugar',
    "Should annotate mixed numbers correctly",
  );

  // Test singular forms
  result = annotateQuantitiesAsHTML("1 teaspoon vanilla");
  console.assert(
    result ===
      '<span class="quantity" title="US-TSP=1" data-value="quantity:US-TSP=1">1 teaspoon</span> vanilla',
    "Should annotate singular teaspoon correctly",
  );

  result = annotateQuantitiesAsHTML("1 tablespoon oil");
  console.assert(
    result ===
      '<span class="quantity" title="US-TBSP=1" data-value="quantity:US-TBSP=1">1 tablespoon</span> oil',
    "Should annotate singular tablespoon correctly",
  );

  result = annotateQuantitiesAsHTML("1 gram nutmeg");
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-G=1" data-value="quantity:METRIC-G=1">1 gram</span> nutmeg',
    "Should annotate singular gram correctly",
  );

  result = annotateQuantitiesAsHTML("1 ounce chocolate");
  console.assert(
    result ===
      '<span class="quantity" title="US-OZ=1" data-value="quantity:US-OZ=1">1 ounce</span> chocolate',
    "Should annotate singular ounce correctly",
  );

  // Test word boundary protection (should NOT match)
  result = annotateQuantitiesAsHTML("1 lemon");
  console.assert(
    result === "1 lemon",
    "Should not match 'l' in 'lemon'",
  );

  result = annotateQuantitiesAsHTML("8 garlic cloves");
  console.assert(
    result === "8 garlic cloves",
    "Should not match 'g' in 'garlic'",
  );

  result = annotateQuantitiesAsHTML("5 ozonic compounds");
  console.assert(
    result === "5 ozonic compounds",
    "Should not match 'oz' in 'ozonic'",
  );

  result = annotateQuantitiesAsHTML("put in cupboard");
  console.assert(
    result === "put in cupboard",
    "Should not match 'cup' in 'cupboard'",
  );

  // Test no match
  result = annotateQuantitiesAsHTML("some words");
  console.assert(
    result === "some words",
    "Should return original string if not match",
  );

  console.log("✓ annotateQuantitiesAsHTML tests passed");
}

export function runParseQuantityTests() {
  testAnnotateQuantities();
}
