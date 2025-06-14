/**
 * ui.ts
 * Handles all direct DOM manipulation and UI event logic.
 *
 * URL Management Behavior:
 * - URL input field is the source of truth for the browser URL
 * - Browser URL mirrors the URL input field (when non-empty)
 * - URL is cleared when user edits the recipe content (document becomes "dirty")
 * - Initial load has clean URL (no parameters) since input starts empty
 * - Import tab is the default (no tab parameter needed), only edit/view tabs set parameters
 */

import { initializeTimers } from "./timer";
import { getRecipeTitleFromMarkdown } from "./parser";

// Document Title Management
const DEFAULT_APP_TITLE = "Recipe App";

function setDocumentTitle(recipeTitle: string | null): void {
  if (recipeTitle && recipeTitle.trim() !== "") {
    document.title = `${recipeTitle} | ${DEFAULT_APP_TITLE}`;
  } else {
    document.title = DEFAULT_APP_TITLE;
  }
}

// A type definition for clarity
export type TabId = "import" | "edit" | "view";

// Keep references to all UI elements in one place
export const elements = {
  tabButtons: document.querySelectorAll(
    ".tab-button",
  ) as NodeListOf<HTMLButtonElement>,
  tabContents: document.querySelectorAll(
    ".tab-content",
  ) as NodeListOf<HTMLDivElement>,
  importButton: document.querySelector("#import button") as HTMLButtonElement,
  urlInput: document.querySelector(
    '#import input[type="url"]',
  ) as HTMLInputElement,
  editTextArea: document.querySelector("#edit textarea") as HTMLTextAreaElement,
  renderedRecipeView: document.getElementById(
    "renderedRecipeView",
  ) as HTMLDivElement,
  importForm: document.getElementById("import-form") as HTMLFormElement, // Added import form element
};

// Private helper to update the import button's state
function _updateImportButtonState(): void {
  elements.importButton.disabled = elements.urlInput.value.trim() === "";
}

// Called from main.ts to set the URL from a query parameter
export function setInitialUrl(url: string | null): void {
  if (url) {
    elements.urlInput.value = url;
  }
  _updateImportButtonState(); // Update button based on initial value (from param or HTML default)
}

// Called from main.ts after a successful import
export function notifyUrlImportSuccess(importedUrl: string): void {
  elements.urlInput.value = importedUrl;
  _updateImportButtonState();
  // Browser URL will be updated automatically since URL input changed
}

// Function to switch tabs
export function switchToTab(
  tabId: TabId,
  onTabSwitch?: (tabId: TabId) => void,
  shouldUpdateUI: boolean = true,
): void {
  elements.tabButtons.forEach((btn) => btn.classList.remove("active"));
  elements.tabContents.forEach((content) => content.classList.remove("active"));

  const buttonToActivate = document.querySelector(
    `.tab-button[data-tab="${tabId}"]`,
  );
  const contentToActivate = document.getElementById(tabId);

  if (buttonToActivate && contentToActivate) {
    buttonToActivate.classList.add("active");
    contentToActivate.classList.add("active");

    // Update browser URL to reflect current tab and URL input and also document title
    if (shouldUpdateUI) {
      updateBrowserURL();
    }

    if (onTabSwitch) {
      onTabSwitch(tabId);
    }
  }
}

// Helper function to get the current active tab ID
export function getCurrentTabId(): TabId {
  const activeTabContent = document.querySelector(".tab-content.active");
  // Assuming a tab is always active as per application design.
  // If not, a fallback or error handling would be needed here.
  return activeTabContent!.id as TabId;
}

// Function to update the browser URL with current state (recipe URL and active tab)
// The URL input field is the source of truth - browser URL mirrors it when non-empty
export function updateBrowserURL(): void {
  const activeTabId = getCurrentTabId();
  const queryParams = new URLSearchParams();

  // Only set tab parameter for non-import tabs (import is the default)
  if (activeTabId !== "import") {
    queryParams.set("tab", activeTabId);
  }

  // Mirror the URL input field value in the browser URL
  const urlInputValue = elements.urlInput.value.trim();
  if (urlInputValue) {
    queryParams.set("url", urlInputValue);
  }

  // Update document title based on the current recipe markdown
  const recipeMarkdown = elements.editTextArea.value;
  const recipeTitle = getRecipeTitleFromMarkdown(recipeMarkdown);
  setDocumentTitle(recipeTitle);

  // Construct the new URL path with query parameters
  const queryString = queryParams.toString();
  let newRelativePath;

  // Only include the query string if it's not empty
  if (queryString) {
    newRelativePath = `${window.location.pathname}?${queryString}`;
  } else {
    // If no parameters, just use the path to avoid trailing "?"
    newRelativePath = window.location.pathname;
  }

  // Update only if the new path is different to avoid unnecessary history entries
  // Compare against the current path including search to handle cases where
  // the existing URL has params and the new one should have none.
  if (window.location.pathname + window.location.search !== newRelativePath) {
    window.history.replaceState({}, "", newRelativePath);
  }
}

// Function to initialize all event listeners for the UI
export function initializeUI(
  onTabSwitchCallback: (tabId: TabId) => void,
): void {
  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.getAttribute("data-tab") as TabId;
      if (tab) {
        switchToTab(tab, onTabSwitchCallback, true);
      }
    });
  });

  // URL input field is the source of truth - update browser URL to match
  // Use 'change' instead of 'input' to avoid noisy URL updates while typing
  elements.urlInput.addEventListener("change", () => {
    _updateImportButtonState();
    elements.editTextArea.value = ""; // Clear textarea when URL changes
    updateBrowserURL(); // Mirror URL input field in browser URL
  });

  // Clear URL when user edits content (document becomes "dirty")
  elements.editTextArea.addEventListener("input", () => {
    elements.urlInput.value = ""; // Clear URL input (source of truth)
    _updateImportButtonState();
    updateBrowserURL(); // This will clear the browser URL since input is now empty
  });

  elements.importForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent the default form submission

    // TODO: Implement the import logic here.  You can access the URL from
    // elements.urlInput.value.

    console.log("Importing:", elements.urlInput.value); // Placeholder
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const renderedRecipeView = document.getElementById("renderedRecipeView");

  if (renderedRecipeView) {
    // Initialize timers for duration spans from the timer module.
    // This will attach its own event listener to renderedRecipeView for duration clicks.
    initializeTimers(renderedRecipeView);

    // Add a separate click listener specifically for strikethrough functionality.
    // This ensures that strikethrough logic does not interfere with timer clicks
    // and is only processed if the click was not on a duration-related element.
    renderedRecipeView.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      // Check if the click was on a duration span or its child.
      // If so, it's handled by initializeTimers, so we do nothing here.
      const isDurationClick =
        target.classList.contains("duration") || target.closest(".duration");
      if (isDurationClick) {
        return;
      }

      // Strikethrough logic for list items
      if (target.tagName === "LI") {
        target.classList.toggle("strikethrough");
      } else if (
        target.tagName === "SPAN" &&
        (target.classList.contains("quantity") ||
          target.classList.contains("ingredient"))
      ) {
        // Strikethrough logic for ingredient/quantity spans within list items
        // (typically, these are children of an LI)
        const listItem = target.closest("li");
        if (listItem) {
          listItem.classList.toggle("strikethrough");
        }
      }
    });
  }
});
