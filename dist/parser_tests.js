"use strict";
(() => {
  // src/parser.ts
  var ingredientPatterns = [];
  function createRegExpFromIngredientPattern(pattern) {
    let processedPattern = pattern.trim();
    processedPattern = processedPattern.replace(/(\w+)~/g, "$1s?");
    processedPattern = processedPattern.replace(
      /\s+\[([^\]]+)\]/g,
      "(?:\\s+$1)?",
    );
    processedPattern = processedPattern.replace(/\s+/g, "\\s+");
    return new RegExp(`\\b(${processedPattern})\\b`, "i");
  }
  function initialize(ingredientsText) {
    ingredientPatterns = ingredientsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .sort((a, b) => b.length - a.length)
      .map(createRegExpFromIngredientPattern);
  }
  function highlightIngredients(line) {
    let highlightedLine = line;
    for (const pattern of ingredientPatterns) {
      const globalPattern = new RegExp(pattern.source, "ig");
      highlightedLine = highlightedLine.replace(
        globalPattern,
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
    const multiWordRegex =
      createRegExpFromIngredientPattern("red pepper flakes");
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
  function testHighlightIngredients() {
    console.log("Testing highlightIngredients...");
    const testIngredients = "gorgonzola [cheese]\nalmond~\nred pepper flakes";
    initialize(testIngredients);
    const result1 = highlightIngredients("I like gorgonzola.");
    console.assert(
      result1 === "I like <strong>gorgonzola</strong>.",
      "Should highlight basic ingredient",
    );
    const result2 = highlightIngredients("I like gorgonzola cheese.");
    console.assert(
      result2 === "I like <strong>gorgonzola cheese</strong>.",
      "Should highlight with optional word",
    );
    const result3 = highlightIngredients("Use 100g almonds");
    console.assert(
      result3 === "Use 100g <strong>almonds</strong>",
      "Should highlight plural form",
    );
    const result4 = highlightIngredients(
      "A pinch of red pepper flakes is nice.",
    );
    console.assert(
      result4 === "A pinch of <strong>red pepper flakes</strong> is nice.",
      "Should highlight multi-word ingredient",
    );
    const result5 = highlightIngredients("I like chocolate.");
    console.assert(
      result5 === "I like chocolate.",
      "Should not highlight non-ingredients",
    );
    console.log("\u2713 highlightIngredients tests passed");
  }
  testcreateRegExpFromIngredientPattern();
  testHighlightIngredients();
  console.log("All tests completed!");
})();
