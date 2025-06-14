import * as ui from "./ui";
import type { TabId } from "./ui";
import * as parser from "./parser";
import * as parseIngredient from "./parse-ingredient";

function handleTabSwitch(tabId: string): void {
  if (tabId === "view") {
    const markdown = ui.elements.editTextArea.value;
    ui.elements.renderedRecipeView.innerHTML = parser.markdownToHtml(markdown);
  }
}
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
async function manageFullImportCycle(
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
    processingResult = await processRecipeUrl(url);

    if (processingResult) {
      ui.notifyUrlImportSuccess(url);

      if (switchToDefaultViewOnSuccess) {
        ui.switchToTab("view", handleTabSwitch, true);
        handleTabSwitch("view");
      } else {
        if (ui.getCurrentTabId() === "view") {
          handleTabSwitch("view");
        }
        ui.updateBrowserURL();
      }
    }
  } catch (error) {
    console.error("Error during import cycle management:", error);
    processingResult = false;
  } finally {
    ui.elements.importButton.textContent = "Import";
    ui.elements.importButton.disabled =
      ui.elements.urlInput.value.trim() === "";
  }
  return processingResult;
}

async function initializeApp() {
  try {
    const response = await fetch("ingredients-en.txt");
    if (!response.ok) {
      throw new Error("Failed to load ingredients.txt");
    }
    const ingredientsText = await response.text();
    parseIngredient.loadIngredientDatabase(ingredientsText);

    const queryParams = new URLSearchParams(window.location.search);
    const urlParam = queryParams.get("url");
    const tabParam = queryParams.get("tab") as TabId | null;

    ui.setInitialUrl(urlParam);
    ui.initializeUI(handleTabSwitch);

    ui.elements.importButton.addEventListener("click", async () => {
      await manageFullImportCycle(ui.elements.urlInput.value.trim(), true);
    });

    let initialTab: TabId = "import";
    if (tabParam && ["import", "edit", "view"].includes(tabParam)) {
      initialTab = tabParam;
    }

    ui.switchToTab(initialTab, handleTabSwitch, false);

    if (urlParam) {
      await manageFullImportCycle(urlParam, false);
    } else {
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
initializeApp();
