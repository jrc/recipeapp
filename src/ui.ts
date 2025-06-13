/**
 * ui.ts
 * Handles all direct DOM manipulation and UI event logic.
 */

import { initializeTimers } from "./timer";

// Module-level state for URL management
let initialUrlFromQuery: string | null = null;
let lastImportedUrl: string | null = null;

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
    initialUrlFromQuery = url;
  }
  _updateImportButtonState(); // Update button based on initial value (from param or HTML default)
}

// Called from main.ts after a successful import
export function notifyUrlImportSuccess(importedUrl: string): void {
  elements.urlInput.value = importedUrl;
  lastImportedUrl = importedUrl; // This now takes precedence
  _updateImportButtonState();
  // Browser URL will be updated by the subsequent switchToTab call in handleImport
}

// Function to switch tabs
export function switchToTab(
  tabId: TabId,
  onTabSwitch?: (tabId: TabId) => void,
  updateBrowserUrlOnSwitch?: boolean,
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
    if (updateBrowserUrlOnSwitch) {
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
export function updateBrowserURL(): void {
  const activeTabId = getCurrentTabId();
  const queryParams = new URLSearchParams();

  // Always set the tab parameter
  queryParams.set("tab", activeTabId);

  let urlToSetInBrowser: string | null = null;
  if (lastImportedUrl) {
    urlToSetInBrowser = lastImportedUrl;
  } else if (initialUrlFromQuery) {
    urlToSetInBrowser = initialUrlFromQuery;
  }

  // Only add the 'url' parameter if we have a value for it
  if (urlToSetInBrowser) {
    queryParams.set("url", urlToSetInBrowser);
  }

  // Construct the new URL path with query parameters
  const newRelativePath = `${window.location.pathname}?${queryParams.toString()}`;

  // Update only if the new path is different to avoid unnecessary history entries
  // or potential issues with replaceState.
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

  // Event listener for the URL input field
  elements.urlInput.addEventListener("input", () => {
    // Only update the button state on input, do not change browser URL here.
    _updateImportButtonState();
  });

  // The initial state of the import button is handled by setInitialUrl,
  // which is called in main.ts before initializeUI.

  // Handle form submission
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
