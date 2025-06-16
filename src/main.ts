import * as ui from "./ui";
import type { TabId } from "./ui";
import * as parser from "./parser";
import * as parseIngredient from "./parse-ingredient";
import INGREDIENTS_EN from "./ingredients-en.json";

async function fetchAndParseRecipeFromUrl(
  urlToProcess: string,
): Promise<boolean> {
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

function handleTabSwitch(tabId: string): void {
  if (tabId === "view") {
    const markdown = ui.elements.editTextArea.value;
    ui.elements.renderedRecipeView.innerHTML = parser.markdownToHtml(markdown);
  }
}

async function handleRecipeImport(
  url: string,
  switchToDefaultViewOnSuccess: boolean,
): Promise<boolean> {
  if (!url) {
    return false;
  }

  ui.elements.importButton.textContent = "Importing...";
  ui.elements.importButton.disabled = true;
  let processingResult = false;

  try {
    processingResult = await fetchAndParseRecipeFromUrl(url);

    if (processingResult) {
      ui.notifyUrlImportSuccess(url);

      if (switchToDefaultViewOnSuccess) {
        ui.switchToTab("view", handleTabSwitch, true);
        handleTabSwitch("view"); // Render content after switching
      } else {
        // If not switching, but already on view tab, refresh content
        if (ui.getCurrentTabId() === "view") {
          handleTabSwitch("view");
        }
        ui.updateBrowserURL(); // Update URL even if not switching tab
      }
    }
  } catch (error) {
    console.error("Error during import cycle management:", error);
    processingResult = false; // Ensure result is false on error
  } finally {
    ui.elements.importButton.textContent = "Import";
    ui.elements.importButton.disabled =
      ui.elements.urlInput.value.trim() === "";
  }
  return processingResult;
}

async function initializeApp() {
  console.assert(
    INGREDIENTS_EN && INGREDIENTS_EN.length > 0,
    "Ingredient database is not loaded",
  );
  parseIngredient.loadIngredientDatabase(INGREDIENTS_EN);

  const queryParams = new URLSearchParams(window.location.search);
  const urlParam = queryParams.get("url");
  const tabParam = queryParams.get("tab") as TabId | null;

  ui.setInitialUrl(urlParam);
  ui.initializeUI(handleTabSwitch);

  ui.elements.importButton.addEventListener("click", async () => {
    await handleRecipeImport(ui.elements.urlInput.value.trim(), true);
  });

  let initialTab: TabId = "import";
  if (tabParam && ["import", "edit", "view"].includes(tabParam)) {
    initialTab = tabParam;
  }

  // Switch to the determined initial tab, but don't update URL yet if urlParam exists
  // as handleRecipeImport will handle it.
  ui.switchToTab(initialTab, handleTabSwitch, !urlParam);

  if (urlParam) {
    // If a URL is provided, attempt to import it.
    // The false argument prevents switching to 'view' tab automatically,
    // respecting the 'tab' query parameter if present.
    const importSuccess = await handleRecipeImport(urlParam, false);
    // If import was successful and the initial tab was 'view', render the recipe.
    // Or if the import was successful and no specific tab was requested (defaulting to 'import' initially),
    // and we want to show the 'view' tab after a successful import from URL param.
    // This logic might need refinement based on desired UX for URL param + tab param.
    // For now, if view tab is active after import from URL, render it.
    if (importSuccess && ui.getCurrentTabId() === "view") {
      handleTabSwitch("view");
    } else if (
      importSuccess &&
      initialTab === "import" &&
      ui.elements.editTextArea.value.trim() !== ""
    ) {
      // If imported from URL, default tab was 'import', and we have content,
      // switch to view and render. This makes 'view' the default after URL import.
      ui.switchToTab("view", handleTabSwitch, true);
      handleTabSwitch("view");
    }
  } else {
    // If no URL param, and the initial tab is 'view' and there's content (e.g. from localStorage), render it.
    if (initialTab === "view" && ui.elements.editTextArea.value.trim() !== "") {
      handleTabSwitch("view");
    }
  }
}

initializeApp();
