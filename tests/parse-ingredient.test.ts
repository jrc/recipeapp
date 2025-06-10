import {
  createRegExpFromIngredientPattern,
  emphasizeIngredients,
  initialize,
} from "../src/parse-ingredient";

// Test createRegExpFromIngredientPattern function
function testCreateRegExpFromIngredientPattern() {
  console.log("Testing createRegExpFromIngredientPattern...");

  // Test basic pattern
  const basicRegex = createRegExpFromIngredientPattern("gorgonzola");
  console.assert(
    basicRegex.test("I like gorgonzola"),
    "Should match basic word",
  );
  console.assert(
    !basicRegex.test("I like gorgonzolas"),
    "Should not match partial word",
  );

  // Test optional word pattern
  const optionalRegex = createRegExpFromIngredientPattern(
    "gorgonzola [cheese]",
  );
  console.assert(
    optionalRegex.test("I like gorgonzola"),
    "Should match without optional word",
  );
  console.assert(
    optionalRegex.test("I like gorgonzola cheese"),
    "Should match with optional word",
  );

  // Test plural pattern
  const pluralRegex = createRegExpFromIngredientPattern("almond~");
  console.assert(pluralRegex.test("I need almond"), "Should match singular");
  console.assert(pluralRegex.test("I need almonds"), "Should match plural");

  // Test multi-word pattern
  const multiWordRegex = createRegExpFromIngredientPattern("red pepper flakes");
  console.assert(
    multiWordRegex.test("Add red pepper flakes"),
    "Should match multi-word phrase",
  );
  console.assert(
    !multiWordRegex.test("Add red pepper"),
    "Should not match partial phrase",
  );

  console.log("✓ createRegExpFromIngredientPattern tests passed");
}

// Test emphasizeIngredients function
function testHighlightIngredients() {
  console.log("Testing emphasizeIngredients...");

  // Initialize with test ingredients
  const testIngredients = "gorgonzola [cheese]\nalmond~\nred pepper flakes";
  initialize(testIngredients);

  // Test basic highlighting
  const result1 = emphasizeIngredients("I like gorgonzola.");
  console.assert(
    result1 === "I like <strong>gorgonzola</strong>.",
    "Should highlight basic ingredient",
  );

  // Test optional word highlighting
  const result2 = emphasizeIngredients("I like gorgonzola cheese.");
  console.assert(
    result2 === "I like <strong>gorgonzola cheese</strong>.",
    "Should highlight with optional word",
  );

  // Test plural highlighting
  const result3 = emphasizeIngredients("Use 100g almonds");
  console.assert(
    result3 === "Use 100g <strong>almonds</strong>",
    "Should highlight plural form",
  );

  // Test multi-word highlighting
  const result4 = emphasizeIngredients("A pinch of red pepper flakes is nice.");
  console.assert(
    result4 === "A pinch of <strong>red pepper flakes</strong> is nice.",
    "Should highlight multi-word ingredient",
  );

  // Test no match
  const result5 = emphasizeIngredients("I like chocolate.");
  console.assert(
    result5 === "I like chocolate.",
    "Should not highlight non-ingredients",
  );

  console.log("✓ emphasizeIngredients tests passed");
}

export function runParseIngredientTests() {
  testCreateRegExpFromIngredientPattern();
  testHighlightIngredients();
}
