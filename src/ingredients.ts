/**
 * ingredients.ts
 * Handles ingredient pattern processing and matching.
 */

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

export function createIngredientRegexes(ingredientsText: string): RegExp[] {
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
