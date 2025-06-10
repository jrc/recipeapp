/**
 * parse-ingredient.ts
 * Handles ingredient pattern processing and matching.
 */

// --- Module-level store for ingredient patterns ---
let ingredientPatterns: RegExp[] = [];

/**
 * Initializes the parser with ingredient patterns. Must be called on startup.
 * @param ingredientsText The raw text content from ingredients.txt.
 */
export function initialize(ingredientsText: string) {
  ingredientPatterns = createIngredientRegexes(ingredientsText);
}

export function createRegExpFromIngredientPattern(pattern: string): RegExp {
  let processedPattern = pattern.trim();

  // Handle plurals first: word~ -> words?
  processedPattern = processedPattern.replace(/(\w+)~/g, "$1s?");

  // Handle optional words with preceding spaces: " [word]" -> "(?:\s+word)?"
  processedPattern = processedPattern.replace(
    /\s+\[([^\]]+)\]/g,
    "(?:\\s+$1)?",
  );

  // Handle spaces in multi-word patterns
  processedPattern = processedPattern.replace(/\s+/g, "\\s+");

  // Use word boundaries `\b` to match whole words only.
  // `i` flag for case-insensitivity
  return new RegExp(`\\b(${processedPattern})\\b`, "i");
}

function createIngredientRegexes(ingredientsText: string): RegExp[] {
  return (
    ingredientsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      // IMPORTANT: Sort by length descending to match longer phrases first
      // (e.g., "gorgonzola cheese" before just "cheese")
      .sort((a, b) => b.length - a.length)
      .map(createRegExpFromIngredientPattern)
  );
}

/**
 * Finds and wraps matching ingredients in a line of text with <strong> tags.
 * @param line A single line of text, like an ingredient from the recipe.
 */
export function emphasizeIngredients(line: string): string {
  let highlightedLine = line;
  for (const pattern of ingredientPatterns) {
    // Use replace with global flag to replace all occurrences
    const globalPattern = new RegExp(pattern.source, "ig");
    highlightedLine = highlightedLine.replace(
      globalPattern,
      (match) => `<strong>${match}</strong>`,
    );
  }
  return highlightedLine;
}
