/**
 * ui.ts
 * Handles all direct DOM manipulation and UI event logic.
 */

import { initializeTimers } from "./timer";

// A type definition for clarity
type TabId = "import" | "edit" | "view";

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
};

// Function to switch tabs
export function switchToTab(
  tabId: TabId,
  onTabSwitch?: (tabId: TabId) => void,
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
    if (onTabSwitch) {
      onTabSwitch(tabId);
    }
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
        switchToTab(tab, onTabSwitchCallback);
      }
    });
  });

  // Logic to disable/enable import button
  const updateImportButtonState = () => {
    elements.importButton.disabled = elements.urlInput.value.trim() === "";
  };
  elements.urlInput.addEventListener("input", updateImportButtonState);
  updateImportButtonState(); // Set initial state
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
          const isDurationClick = target.classList.contains("duration") || target.closest(".duration");
          if (isDurationClick) {
            return;
          }

          // Strikethrough logic for list items and paragraphs
          if (target.tagName === "LI" || target.tagName === "P") {
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
