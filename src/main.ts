import * as ui from "./ui";
import * as parser from "./parser";
import * as parseIngredient from "./parse-ingredient";

// --- Main Application Logic ---

function handleTabSwitch(tabId: string): void {
  if (tabId === "view") {
    const markdown = ui.elements.editTextArea.value;
    ui.elements.renderedRecipeView.innerHTML = parser.markdownToHtml(markdown);
  }
}

async function handleImport(): Promise<void> {
  const targetUrl = ui.elements.urlInput.value.trim();
  if (!targetUrl) return;

  ui.elements.importButton.textContent = "Importing...";
  ui.elements.importButton.disabled = true;

  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const jsonLdScript = doc.querySelector(
      'script[type="application/ld+json"]',
    );

    if (!jsonLdScript?.textContent) {
      throw new Error("No JSON-LD script tag found on the page.");
    }

    const data = JSON.parse(jsonLdScript.textContent);
    const recipeJson = Array.isArray(data["@graph"])
      ? data["@graph"].find((item: any) => item["@type"]?.includes("Recipe"))
      : data["@type"]?.includes("Recipe")
        ? data
        : null;

    if (recipeJson) {
      const recipeMarkdown = parser.convertJsonLdToRecipeMarkdown(recipeJson);
      ui.elements.editTextArea.value = recipeMarkdown;
      ui.switchToTab("edit", handleTabSwitch);
    } else {
      const errorMessage =
        "Import failed: No Schema.org/Recipe JSON-LD data found on that page.";
      console.error(errorMessage);
      alert(errorMessage);
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Import failed:", errorMessage);
    alert(`Import failed: ${errorMessage}`);
  } finally {
    ui.elements.importButton.textContent = "Import";
    ui.elements.importButton.disabled = false;
  }
}

// --- Initialization Function ---

async function initializeApp() {
  try {
    // Fetch the ingredients list and initialize the parser
    const response = await fetch("ingredients-en.txt");
    if (!response.ok) {
      throw new Error("Failed to load ingredients.txt");
    }
    const ingredientsText = await response.text();
    parseIngredient.loadIngredientDatabase(ingredientsText);

    // Set up all UI event listeners and pass our callback
    ui.initializeUI(handleTabSwitch);

    // Attach the main import logic to the button click
    ui.elements.importButton.addEventListener("click", handleImport);
  } catch (error) {
    console.error("Failed to initialize application:", error);
    alert(
      "Could not initialize the application. Please ensure ingredients-en.txt is available and reload the page.",
    );
  }
}

// --- Start the application ---
initializeApp();
