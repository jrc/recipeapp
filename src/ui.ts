/**
 * ui.ts
 * Handles all direct DOM manipulation and UI event logic.
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

export type TabId = "import" | "edit" | "view";
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
  importForm: document.getElementById("import-form") as HTMLFormElement,
};

// Called from main.ts to set the URL from a query parameter
export function setInitialUrl(url: string | null): void {
  if (url) {
    elements.urlInput.value = url;
  }
  elements.importButton.disabled = elements.urlInput.value.trim() === "";
}

export function notifyUrlImportSuccess(importedUrl: string): void {
  elements.urlInput.value = importedUrl;
  elements.importButton.disabled = elements.urlInput.value.trim() === "";
}

export function switchToTab(
  tabId: TabId,
  onTabSwitch?: (tabId: TabId) => void,
  shouldUpdateUI: boolean = true,
): void {
  elements.tabButtons.forEach((btn) => btn.classList.remove("active"));
  elements.tabContents.forEach((content) => content.classList.remove("active"));

  const buttonToActivate = document.querySelector(
    `.tab-button[data-tab="${tabId}"]`,
  ) as HTMLButtonElement;
  const contentToActivate = document.getElementById(tabId) as HTMLDivElement;

  buttonToActivate.classList.add("active");
  contentToActivate.classList.add("active");

  if (shouldUpdateUI) {
    updateBrowserURL();
  }

  if (onTabSwitch) {
    onTabSwitch(tabId);
  }
}

export function getCurrentTabId(): TabId {
  const activeTabContent = document.querySelector(
    ".tab-content.active",
  ) as HTMLDivElement;
  return activeTabContent.id as TabId;
}

export function updateBrowserURL(): void {
  const activeTabId = getCurrentTabId();
  const queryParams = new URLSearchParams();

  if (activeTabId !== "import") {
    queryParams.set("tab", activeTabId);
  }

  const urlInputValue = elements.urlInput.value.trim();
  if (urlInputValue) {
    queryParams.set("url", urlInputValue);
  }
  const recipeMarkdown = elements.editTextArea.value;
  const recipeTitle = getRecipeTitleFromMarkdown(recipeMarkdown);
  setDocumentTitle(recipeTitle);

  const queryString = queryParams.toString();
  const newRelativePath = queryString
    ? `${window.location.pathname}?${queryString}`
    : window.location.pathname;

  if (window.location.pathname + window.location.search !== newRelativePath) {
    window.history.replaceState({}, "", newRelativePath);
  }
}

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

  elements.urlInput.addEventListener("change", () => {
    elements.importButton.disabled = elements.urlInput.value.trim() === "";
    elements.editTextArea.value = "";
    updateBrowserURL();
  });

  elements.editTextArea.addEventListener("input", () => {
    elements.urlInput.value = "";
    elements.importButton.disabled = elements.urlInput.value.trim() === "";
    updateBrowserURL();
  });

  elements.importForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const renderedRecipeView = document.getElementById("renderedRecipeView");

  if (renderedRecipeView) {
    initializeTimers(renderedRecipeView);
    renderedRecipeView.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      const isDurationClick =
        target.classList.contains("duration") || target.closest(".duration");
      if (isDurationClick) {
        return;
      }
      if (target.tagName === "LI") {
        target.classList.toggle("strikethrough");
      } else if (
        target.tagName === "SPAN" &&
        (target.classList.contains("quantity") ||
          target.classList.contains("ingredient"))
      ) {
        const listItem = target.closest("li");
        if (listItem) {
          listItem.classList.toggle("strikethrough");
        }
      }
    });
  }
});
