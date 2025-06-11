import { annotateQuantitiesAsHTML } from "../src/parse-quantity";

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
  // Test basic units (convertToMetric=true)
  let result = annotateQuantitiesAsHTML("2 cups", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=0.47318" data-value="quantity:METRIC-L=0.47318">2 cups</span>',
    "Should annotate cups correctly (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("1 tsp", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=0.00493" data-value="quantity:METRIC-L=0.00493">1 tsp</span>',
    "Should annotate tsp correctly (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("3 tbsp", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=0.04437" data-value="quantity:METRIC-L=0.04437">3 tbsp</span>',
    "Should annotate tbsp correctly (convertToMetric=true)",
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
      '<span class="quantity" title="METRIC-KG=0.2268" data-value="quantity:METRIC-KG=0.2268">8 oz</span>',
    "Should annotate oz correctly (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("2 lb", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-KG=0.90718" data-value="quantity:METRIC-KG=0.90718">2 lb</span>',
    "Should annotate lb correctly (convertToMetric=true)",
  );

  // Test plural units (convertToMetric=true)
  result = annotateQuantitiesAsHTML("2 cups flour", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=0.47318" data-value="quantity:METRIC-L=0.47318">2 cups</span> flour',
    "Should annotate plural cups correctly (convertToMetric=true)",
  );

  // Test fractions (convertToMetric=true)
  result = annotateQuantitiesAsHTML("1/2 cup milk", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=0.118295" data-value="quantity:METRIC-L=0.118295">1/2 cup</span> milk',
    "Should annotate fractions correctly (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("1½ tsp salt", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=0.007395" data-value="quantity:METRIC-L=0.007395">1½ tsp</span> salt',
    "Should annotate unicode fractions correctly (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("2 1/4 cups sugar", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=0.5323275" data-value="quantity:METRIC-L=0.5323275">2 1/4 cups</span> sugar',
    "Should annotate mixed numbers correctly (convertToMetric=true)",
  );

  // Test singular forms (convertToMetric=true)
  result = annotateQuantitiesAsHTML("1 teaspoon vanilla", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=0.00493" data-value="quantity:METRIC-L=0.00493">1 teaspoon</span> vanilla',
    "Should annotate singular teaspoon correctly (convertToMetric=true)",
  );

  result = annotateQuantitiesAsHTML("1 tablespoon oil", true);
  console.assert(
    result ===
      '<span class="quantity" title="METRIC-L=0.01479" data-value="quantity:METRIC-L=0.01479">1 tablespoon</span> oil',
    "Should annotate singular tablespoon correctly (convertToMetric=true)",
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
      '<span class="quantity" title="METRIC-KG=0.02835" data-value="quantity:METRIC-KG=0.02835">1 ounce</span> chocolate',
    "Should annotate singular ounce correctly (convertToMetric=true)",
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

export function runParseQuantityTests() {
  testAnnotateQuantities();
  testAnnotateQuantitiesWithMetricConversion();

  console.log("parse-quantity tests completed.");
}
