/**
 * parser.ts
 * Contains all functions for data transformation (JSON-LD -> Markdown, Markdown -> HTML).
 */

import { annotateDurationsAsHTML } from "./parse-duration";
import { emphasizeIngredients } from "./parse-ingredient";
import { annotateQuantitiesAsHTML } from "./parse-quantity";

function formatIsoDuration(isoDuration: string): string {
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

export function convertJsonLdToRecipeMarkdown(recipeJson: any): string {
  const markdownParts: string[] = [];
  if (recipeJson.image) {
    let imageUrl: string | undefined;
    if (typeof recipeJson.image === "string") imageUrl = recipeJson.image;
    else if (Array.isArray(recipeJson.image)) {
      const firstImage = recipeJson.image[0];
      if (typeof firstImage === "string") imageUrl = firstImage;
      else if (firstImage && typeof firstImage === "object" && firstImage.url)
        imageUrl = firstImage.url;
    } else if (typeof recipeJson.image === "object" && recipeJson.image.url) {
      imageUrl = recipeJson.image.url;
    }
    if (imageUrl) markdownParts.push(`![Recipe Image](${imageUrl})\n`);
  }
  if (recipeJson.name) markdownParts.push(`# ${recipeJson.name}\n`);
  if (recipeJson.description) markdownParts.push(`${recipeJson.description}\n`);
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
 * Extracts the main recipe title (first H1) from markdown content.
 * @param markdown The markdown string to parse.
 * @returns The extracted title, or null if no H1 is found.
 */
export function getRecipeTitleFromMarkdown(markdown: string): string | null {
  if (!markdown) return null;
  const lines = markdown.split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("# ")) {
      // Remove '# ' and trim any leading/trailing whitespace from the title itself
      return trimmedLine.substring(2).trim();
    }
  }
  return null; // No H1 found
}

/**
 * A basic markdown-to-HTML renderer.
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // 1. Process inline-level styles.
  html = html.replace(/(^|\W)\*\*(.*?)\*\*(\W|$)/g, "$1<strong>$2</strong>$3");
  html = html.replace(/(^|\W)_(.*?)_(\W|$)/g, "$1<em>$2</em>$3");

  // 2. Process block-level elements.
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
  html = html.replace(/^---\s*$/gm, "<hr>");
  html = html.replace(/^>\s*(.*)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^####\s*(.*)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s*(.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s*(.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s*(.*)$/gm, "<h1>$1</h1>");

  // 3. Process lists and apply annotations.
  html = html.replace(/^[-\*] (.*)$/gm, (_match, content: string) => {
    const annotatedContent = emphasizeIngredients(
      annotateDurationsAsHTML(annotateQuantitiesAsHTML(content, true, true)),
    );
    return `<li class="unordered">${annotatedContent}</li>`;
  });
  html = html.replace(/^\d+\.\s*(.*)$/gm, (_match, content: string) => {
    const annotatedContent = emphasizeIngredients(
      annotateDurationsAsHTML(annotateQuantitiesAsHTML(content, true, true)),
    );
    return `<li class="ordered">${annotatedContent}</li>`;
  });

  // Wrap consecutive list items in appropriate list tags
  html = html.replace(/((?:<li class="unordered">.*<\/li>\n?)+)/g, (match) => {
    // Remove the class attributes before wrapping
    const cleanMatch = match.replace(/ class="unordered"/g, "");
    return `<ul>\n${cleanMatch}</ul>`;
  });

  html = html.replace(/((?:<li class="ordered">.*<\/li>\n?)+)/g, (match) => {
    // Remove the class attributes before wrapping
    const cleanMatch = match.replace(/ class="ordered"/g, "");
    return `<ol>\n${cleanMatch}</ol>`;
  });

  // 4. Handle paragraphs.
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
