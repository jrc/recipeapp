/**
 * parser.ts
 * Contains all functions for data transformation (JSON-LD -> Markdown, Markdown -> HTML).
 */

// --- NEW: Module-level store for ingredient patterns ---
let ingredientPatterns: RegExp[] = [];

/**
 * Converts a pattern string from ingredients.txt into a regular expression.
 * Handles optional words `[word]` and plurals `word~`.
 * @param pattern The raw pattern string (e.g., "gorgonzola [cheese]").
 */
function createRegExpFromPattern(pattern: string): RegExp {
  const processedPattern = pattern
    .trim()
    .replace(/(\w+)~/g, "$1s?") // Handle plurals: almond~ -> almonds?
    .replace(/\[(\w+)\]/g, "(?:\\s+$1)?") // Handle optional words: [cheese] -> (?:\s+cheese)?
    .replace(/\s+/g, "\\s+"); // Handle spaces in multi-word patterns

  // Use word boundaries `\b` to match whole words only.
  // `i` flag for case-insensitivity, `g` for string.matchAll()
  return new RegExp(`\\b(${processedPattern})\\b`, "ig");
}

/**
 * Initializes the parser with ingredient patterns. Must be called on startup.
 * @param ingredientsText The raw text content from ingredients.txt.
 */
export function initialize(ingredientsText: string) {
  ingredientPatterns = ingredientsText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    // IMPORTANT: Sort by length descending to match longer phrases first
    // (e.g., "gorgonzola cheese" before just "cheese")
    .sort((a, b) => b.length - a.length)
    .map(createRegExpFromPattern);
}

/**
 * Finds and wraps matching ingredients in a line of text with <strong> tags.
 * @param line A single line of text, like an ingredient from the recipe.
 */
function highlightIngredients(line: string): string {
  let highlightedLine = line;
  for (const pattern of ingredientPatterns) {
    // Use replace with a callback to avoid issues with special characters in the replacement string
    highlightedLine = highlightedLine.replaceAll(
      pattern,
      (match) => `<strong>${match}</strong>`,
    );
  }
  return highlightedLine;
}

// --- (formatIsoDuration function remains unchanged) ---
export function formatIsoDuration(isoDuration: string): string {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?/;
  const matches = isoDuration.match(regex);
  if (!matches) return isoDuration;
  const hours = matches[1] ? parseInt(matches[1], 10) : 0;
  const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  return parts.join(" ");
}

// --- (convertJsonToRecipeMarkdown function remains unchanged) ---
export function convertJsonToRecipeMarkdown(recipeJson: any): string {
  const markdownParts: string[] = [];
  if (recipeJson.image) {
    let imageUrl: string | undefined;
    if (typeof recipeJson.image === "string") imageUrl = recipeJson.image;
    else if (Array.isArray(recipeJson.image)) {
      const firstImage = recipeJson.image[0];
      if (typeof firstImage === "string") imageUrl = firstImage;
      else if (typeof firstImage === "object" && firstImage.url)
        imageUrl = firstImage.url;
    } else if (typeof recipeJson.image === "object" && recipeJson.image.url) {
      imageUrl = recipeJson.image.url;
    }
    if (imageUrl) markdownParts.push(`![Recipe Image](${imageUrl})\n`);
  }
  if (recipeJson.name) markdownParts.push(`# ${recipeJson.name}\n`);
  if (recipeJson.description)
    markdownParts.push(`> ${recipeJson.description}\n`);
  if (recipeJson.author) {
    const authorName =
      typeof recipeJson.author === "string"
        ? recipeJson.author
        : recipeJson.author.name ||
          (Array.isArray(recipeJson.author) && recipeJson.author[0].name);
    if (authorName) markdownParts.push(`_By: ${authorName}_\n`);
  }
  const metadataLines: string[] = [];
  if (recipeJson.prepTime)
    metadataLines.push(
      `**Prep Time:** ${formatIsoDuration(recipeJson.prepTime)}`,
    );
  if (recipeJson.cookTime)
    metadataLines.push(
      `**Cook Time:** ${formatIsoDuration(recipeJson.cookTime)}`,
    );
  if (recipeJson.totalTime)
    metadataLines.push(
      `**Total Time:** ${formatIsoDuration(recipeJson.totalTime)}`,
    );
  if (recipeJson.recipeYield) {
    const servings = Array.isArray(recipeJson.recipeYield)
      ? recipeJson.recipeYield.join(", ")
      : recipeJson.recipeYield;
    metadataLines.push(`**Servings:** ${servings}`);
  }
  if (recipeJson.recipeCategory)
    metadataLines.push(`**Category:** ${recipeJson.recipeCategory}`);
  if (recipeJson.recipeCuisine)
    metadataLines.push(`**Cuisine:** ${recipeJson.recipeCuisine}`);
  if (metadataLines.length > 0)
    markdownParts.push("\n" + metadataLines.join("\n"));
  markdownParts.push("\n---\n");
  if (
    recipeJson.recipeIngredient &&
    Array.isArray(recipeJson.recipeIngredient)
  ) {
    markdownParts.push("## Ingredients\n");
    markdownParts.push(
      recipeJson.recipeIngredient
        .map((i: string) => `- ${i.trim()}`)
        .join("\n") + "\n",
    );
  }
  if (
    recipeJson.recipeInstructions &&
    Array.isArray(recipeJson.recipeInstructions)
  ) {
    markdownParts.push("## Instructions\n");
    markdownParts.push(
      recipeJson.recipeInstructions
        .map(
          (s: any, i: number) =>
            `${i + 1}. ${(typeof s === "object" && s.text ? s.text : s).trim()}`,
        )
        .join("\n") + "\n",
    );
  }
  return markdownParts.join("\n");
}

/**
 * A basic markdown-to-HTML renderer.
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
  html = html.replace(/^---\s*$/gm, "<hr>");
  html = html.replace(/^>\s*(.*)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^##\s*(.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s*(.*)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // --- List Processing ---
  // Unordered lists (ingredients)
  html = html.replace(/^- (.*)$/gm, (_match, content: string) => {
    return `<li>${highlightIngredients(content)}</li>`;
  });
  // Ordered lists (instructions)
  html = html.replace(/^\d+\.\s*(.*)$/gm, (_match, content: string) => {
    return `<li>${highlightIngredients(content)}</li>`;
  });

  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, (match) => {
    // This logic needs to be a bit smarter to create the correct list type
    // A simple check for a number at the start of the first li content is enough
    const isOrdered =
      /<li\s*>\s*\d*\.?\s*/.test(match) || /<li\s*>\s*\d+\.\s*/.test(match);
    return isOrdered ? `<ol>\n${match}</ol>` : `<ul>\n${match}</ul>`;
  });

  html = html.replace(/\n{2,}/g, "\n\n");
  html = html
    .split("\n\n")
    .map((paragraph) => {
      if (!paragraph.match(/<(h[1-6]|ul|ol|blockquote|hr|p|img)>/i)) {
        return `<p>${paragraph.replace(/\n/g, "<br>")}</p>`;
      }
      return paragraph;
    })
    .join("\n\n");

  return html;
}
