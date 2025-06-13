import * as ui from "./ui";
import type { TabId } from "./ui";
import * as parser from "./parser";
import * as parseIngredient from "./parse-ingredient";

// --- Main Application Logic ---

function handleTabSwitch(tabId: string): void {
  if (tabId === "view") {
    const markdown = ui.elements.editTextArea.value;
    ui.elements.renderedRecipeView.innerHTML = parser.markdownToHtml(markdown);
  }
}

/**
 * Processes the given URL to fetch, parse, and populate the recipe content.
 * Does not handle UI changes like button text or tab switching.
 * @param urlToProcess The URL of the recipe to process.
 * @returns True if processing was successful, false otherwise.
 */
async function processRecipeUrl(urlToProcess: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://corsproxy.jrcplus.workers.dev/?url=${encodeURIComponent(urlToProcess)}`,
    );
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
      return true;
    } else {
      const errorMessage =
        "Import failed: No Schema.org/Recipe JSON-LD data found on that page.";
      console.error(errorMessage);
      alert(errorMessage);
      return false;
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Import failed:", errorMessage);
    alert(`Import failed: ${errorMessage}`);
    return false;
  }
}

/**
 * Manages the full import cycle including UI updates, processing, and tab switching.
 * @param url The URL to import.
 * @param switchToEditOnSuccess If true, switches to the 'edit' tab upon successful import.
 * @returns True if the import and processing were successful, false otherwise.
 */
async function manageFullImportCycle(
  url: string,
  switchToEditOnSuccess: boolean,
): Promise<boolean> {
  if (!url) {
    // alert("Please enter a URL to import."); // Or rely on button disable state
    return false;
  }

  ui.elements.importButton.textContent = "Importing...";
  ui.elements.importButton.disabled = true;
  let processingResult = false;

  try {
    processingResult = await processRecipeUrl(url);

    if (processingResult) {
      ui.notifyUrlImportSuccess(url); // Updates lastImportedUrl for URL sync

      if (switchToEditOnSuccess) {
        // This call will also trigger updateBrowserURL via switchToTab
        ui.switchToTab("edit", handleTabSwitch, true);
      } else {
        // Auto-import: The initial tab is already active (silently).
        // If the current active tab (which was set as initialTab) is "view",
        // we need to render the newly imported content.
        if (ui.getCurrentTabId() === "view") {
          handleTabSwitch("view");
        }
        // Ensure browser URL reflects the imported recipe URL and the current (initial) tab.
        ui.updateBrowserURL();
      }
    }
  } catch (error) {
    // This catch is mostly for unexpected errors in the cycle itself,
    // as processRecipeUrl handles its own specific errors and alerts.
    console.error("Error during import cycle management:", error);
    processingResult = false; // Ensure it's marked as failed
  } finally {
    ui.elements.importButton.textContent = "Import";
    // Ensure button state is correct based on whether input has a URL
    ui.elements.importButton.disabled =
      ui.elements.urlInput.value.trim() === "";
  }
  return processingResult;
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

    // Initialize state from URL query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const urlParam = queryParams.get("url");
    const tabParam = queryParams.get("tab") as TabId | null;

    // Set the initial URL in the UI module. This populates the input field
    // and lets the UI module know about this URL from the start.
    // This function also handles the initial state of the import button.
    ui.setInitialUrl(urlParam);

    // Set up all UI event listeners and pass our callback
    ui.initializeUI(handleTabSwitch);

    // Attach the main import logic to the button click
    ui.elements.importButton.addEventListener("click", async () => {
      await manageFullImportCycle(ui.elements.urlInput.value.trim(), true);
    });

    // Determine initial tab: from param, or 'view' if param is invalid/missing
    let initialTab: TabId = "import"; // Default tab
    if (tabParam && ["import", "edit", "view"].includes(tabParam)) {
      initialTab = tabParam;
    }

    // Switch to the initial tab.
    // This first call to switchToTab will NOT update the browser URL because
    // the third argument 'updateBrowserUrlOnSwitch' is false.
    ui.switchToTab(initialTab, handleTabSwitch, false);

    // If a URL was provided in the query parameters, attempt to import it automatically.
    // The `manageFullImportCycle` function with `switchToEditOnSuccess: false` will handle
    // calling `handleTabSwitch("view")` if needed and updating the browser URL.
    if (urlParam) {
      await manageFullImportCycle(urlParam, false);
    } else {
      // No URL param for auto-import.
      // If the initial tab is 'view' and there's default content in the textarea
      // (e.g., from the HTML), render it.
      if (
        initialTab === "view" &&
        ui.elements.editTextArea.value.trim() !== ""
      ) {
        handleTabSwitch("view");
      }
    }
  } catch (error) {
    console.error("Failed to initialize application:", error);
    alert(
      "Could not initialize the application. Please ensure ingredients-en.txt is available and reload the page.",
    );
  }
}

// --- Start the application ---
initializeApp();
