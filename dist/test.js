"use strict";

// src/parser.ts
var ingredientPatterns = [];
function createRegExpFromIngredientPattern(pattern) {
  const processedPattern = pattern
    .trim()
    .replace(/(\w+)~/g, "$1s?")
    .replace(/\[(\w+)\]/g, "(?:\\s+$1)?")
    .replace(/\s+/g, "\\s+");
  return new RegExp(`\\b(${processedPattern})\\b`, "ig");
}
function initialize(ingredientsText) {
  ingredientPatterns = ingredientsText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .sort((a, b) => b.length - a.length)
    .map(createRegExpFromIngredientPattern);
}
function testEmphasizeIngredients(line) {
  let highlightedLine = line;
  for (const pattern of ingredientPatterns) {
    highlightedLine = highlightedLine.replaceAll(
      pattern,
      (match) => `<strong>${match}</strong>`,
    );
  }
  return highlightedLine;
}

// tests/parser_tests.ts
function testcreateRegExpFromIngredientPattern() {
  console.log("Testing createRegExpFromIngredientPattern...");
  const basicRegex = createRegExpFromIngredientPattern("gorgonzola");
  console.assert(
    basicRegex.test("I like gorgonzola"),
    "Should match basic word",
  );
  console.assert(
    !basicRegex.test("I like gorgonzolas"),
    "Should not match partial word",
  );
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
  const pluralRegex = createRegExpFromIngredientPattern("almond~");
  console.assert(pluralRegex.test("I need almond"), "Should match singular");
  console.assert(pluralRegex.test("I need almonds"), "Should match plural");
  const multiWordRegex = createRegExpFromIngredientPattern("red pepper flakes");
  console.assert(
    multiWordRegex.test("Add red pepper flakes"),
    "Should match multi-word phrase",
  );
  console.assert(
    !multiWordRegex.test("Add red pepper"),
    "Should not match partial phrase",
  );
  console.log("\u2713 createRegExpFromIngredientPattern tests passed");
}
function testEmphasizeIngredients() {
  console.log("Testing testEmphasizeIngredients...");
  const testIngredients = "gorgonzola [cheese]\nalmond~\nred pepper flakes";
  initialize(testIngredients);
  const result1 = testEmphasizeIngredients("I like gorgonzola.");
  console.assert(
    result1 === "I like <strong>gorgonzola</strong>.",
    "Should highlight basic ingredient",
  );
  const result2 = testEmphasizeIngredients("I like gorgonzola cheese.");
  console.assert(
    result2 === "I like <strong>gorgonzola cheese</strong>.",
    "Should highlight with optional word",
  );
  const result3 = testEmphasizeIngredients("Use 100g almonds");
  console.assert(
    result3 === "Use 100g <strong>almonds</strong>",
    "Should highlight plural form",
  );
  const result4 = testEmphasizeIngredients(
    "A pinch of red pepper flakes is nice.",
  );
  console.assert(
    result4 === "A pinch of <strong>red pepper flakes</strong> is nice.",
    "Should highlight multi-word ingredient",
  );
  const result5 = testEmphasizeIngredients("I like chocolate.");
  console.assert(
    result5 === "I like chocolate.",
    "Should not highlight non-ingredients",
  );
  console.log("\u2713 testEmphasizeIngredients tests passed");
}
testcreateRegExpFromIngredientPattern();
testEmphasizeIngredients();
console.log("All tests completed!");
