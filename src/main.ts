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

async function handleImport(): Promise<void> {
  const targetUrl = ui.elements.urlInput.value.trim();
  if (!targetUrl) return;

  ui.elements.importButton.textContent = "Importing...";
  ui.elements.importButton.disabled = true;

  // CORS (Cross-Origin Resource Sharing) prevents browsers from fetching resources
  // directly from another domain unless the server explicitly allows it.
  // A CORS proxy acts as an intermediary, fetching the data server-side
  // and returning it with headers that allow your browser to access it.

  // We use a proxy because target recipe sites typically do not allow direct fetching.  // Use your deployed Cloudflare Worker as the proxy
  // const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;
  const proxyUrl = `https://corsproxy.jrcplus.workers.dev/?url=${encodeURIComponent(targetUrl)}`;

  try {
    // The request is made to the proxy, which then fetches the content from the targetUrl.
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
      // Notify the UI module of the successful import, passing the original targetUrl
      // This will update the URL input field, internal state, and the browser URL.
      ui.notifyUrlImportSuccess(targetUrl);
      ui.switchToTab("edit", handleTabSwitch, true);
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
    ui.elements.importButton.addEventListener("click", handleImport);

    // Determine initial tab: from param, or 'import' if param is invalid/missing
    let initialTab: TabId = "import"; // Default tab
    if (tabParam && ["import", "edit", "view"].includes(tabParam)) {
      initialTab = tabParam;
    }

    // Switch to the initial tab.
    // This first call to switchToTab will NOT update the browser URL because
    // the third argument 'updateBrowserUrlOnSwitch' is false.
    ui.switchToTab(initialTab, handleTabSwitch, false);

    // If the initial tab is 'view' and there's content in the_
    // edit area (either from default HTML or potentially a future 'recipe data' param),
    // ensure it's rendered.
    if (initialTab === "view" && ui.elements.editTextArea.value.trim() !== "") {
      handleTabSwitch("view");
    }

    // If a URL was provided in the query parameters, attempt to import it automatically.
    if (urlParam) {
      // ui.elements.urlInput.value would have been set by ui.setInitialUrl(urlParam)
      // if urlParam was present. handleImport reads from this input.
      // We await this to ensure the import process (including potential UI updates
      // like switching to the 'edit' tab) completes or errors out before
      // the initializeApp function fully resolves.
      await handleImport();
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
