/**
 * ui.ts
 * Handles all direct DOM manipulation and UI event logic.
 */

import { initializeTimers } from "./timer";
import { getRecipeTitleFromMarkdown } from "./parser";
import { acquireWakeLock, releaseWakeLock } from "./wakelock";
import {
  getGeminiApiKey,
  setGeminiApiKey,
  transformRecipeWithLLM,
} from "./llm";

const DEFAULT_APP_TITLE = "Recipe App";

export type TabId = "import" | "edit" | "view";

// DOM element references
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
  llmPromptInput: document.getElementById("llm-prompt") as HTMLInputElement,
  llmSubmitButton: document.getElementById(
    "llm-submit-button",
  ) as HTMLButtonElement,
  geminiApiKeyInput: document.getElementById(
    "gemini-api-key",
  ) as HTMLInputElement,
  settingsDetails: document.getElementById(
    "settings-details",
  ) as HTMLDetailsElement,
  aiAssistanceDetails: document.getElementById(
    "ai-assistance-details",
  ) as HTMLDetailsElement,
};

// Utility functions
function setDocumentTitle(recipeTitle: string | null): void {
  if (recipeTitle && recipeTitle.trim() !== "") {
    document.title = `${recipeTitle} | ${DEFAULT_APP_TITLE}`;
  } else {
    document.title = DEFAULT_APP_TITLE;
  }
}

// Public API functions
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

  if (tabId === "view") {
    acquireWakeLock();
  } else {
    releaseWakeLock();
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

// Main initialization function
export function initializeUI(
  onTabSwitchCallback: (tabId: TabId) => void,
): void {
  // AI assistance and API key setup
  setupAIAssistance();

  // LLM submit button and prompt handling
  setupLLMHandling();

  // Tab navigation
  setupTabNavigation(onTabSwitchCallback);

  // Import/edit form handling
  setupFormHandling();

  // Cleanup handlers
  setupCleanupHandlers();
}

function setupAIAssistance(): void {
  if (!elements.geminiApiKeyInput || !elements.aiAssistanceDetails) {
    return;
  }

  // Load saved API key
  const savedApiKey = getGeminiApiKey();
  if (savedApiKey) {
    elements.geminiApiKeyInput.value = savedApiKey;
  }

  const updateAIState = () => {
    const apiKey = elements.geminiApiKeyInput.value.trim();
    const isEnabled = apiKey !== "";

    // Add visual cue to the details summary/content when disabled
    elements.aiAssistanceDetails.style.opacity = isEnabled ? "" : "0.6";
  };

  // Initial state update
  updateAIState();

  // Auto-open AI Assistance if key is present on load
  if (elements.geminiApiKeyInput.value.trim() !== "") {
    elements.aiAssistanceDetails.open = true;
  }

  // Event listeners for API key changes
  elements.geminiApiKeyInput.addEventListener("input", updateAIState);
  elements.geminiApiKeyInput.addEventListener("change", () => {
    setGeminiApiKey(elements.geminiApiKeyInput.value);
  });
}

function setupLLMHandling(): void {
  if (
    !elements.llmSubmitButton ||
    !elements.geminiApiKeyInput ||
    !elements.llmPromptInput ||
    !elements.editTextArea
  ) {
    return;
  }

  const updateSubmitButtonState = () => {
    elements.llmSubmitButton.disabled =
      elements.llmPromptInput.value.trim() === "" ||
      elements.geminiApiKeyInput.value.trim() === "";
  };

  // Set initial state of the submit button
  updateSubmitButtonState();

  // Update button state on input changes
  elements.llmPromptInput.addEventListener("input", updateSubmitButtonState);
  elements.geminiApiKeyInput.addEventListener("input", updateSubmitButtonState);

  // Handle "Enter" key in prompt input
  elements.llmPromptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!elements.llmSubmitButton.disabled) {
        elements.llmSubmitButton.click();
      }
    }
  });

  // Handle submit button click
  elements.llmSubmitButton.addEventListener("click", async () => {
    const apiKey = elements.geminiApiKeyInput.value;
    const prompt = elements.llmPromptInput.value;
    const recipeContent = elements.editTextArea.value;

    console.assert(
      prompt.trim() !== "",
      "Submit clicked with empty prompt but button should have been disabled",
    );
    console.assert(
      apiKey.trim() !== "",
      "Submit clicked with empty API key but button should have been disabled",
    );

    if (!prompt.trim() || (!apiKey.trim() && !getGeminiApiKey())) {
      return;
    }

    // Disable controls during processing
    elements.llmPromptInput.disabled = true;
    elements.llmSubmitButton.disabled = true;
    elements.llmSubmitButton.textContent = "Thinking…";

    try {
      const transformedRecipe = await transformRecipeWithLLM(
        apiKey,
        prompt,
        recipeContent,
      );
      elements.editTextArea.value = transformedRecipe;
      elements.editTextArea.select();
      updateBrowserURL(); // Update URL in case title changes due to recipe modification
    } catch (error) {
      console.error("LLM transformation failed:", error);
    } finally {
      // Re-enable controls and reset state
      elements.llmPromptInput.disabled = false;
      elements.llmPromptInput.value = "";
      elements.llmSubmitButton.textContent = "Submit";
      updateSubmitButtonState(); // This will properly set the disabled state
    }
  });
}

function setupTabNavigation(onTabSwitchCallback: (tabId: TabId) => void): void {
  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.getAttribute("data-tab") as TabId;
      if (tab) {
        switchToTab(tab, onTabSwitchCallback, true);
      }
    });
  });
}

function setupFormHandling(): void {
  // URL input handling
  elements.urlInput.addEventListener("change", () => {
    elements.importButton.disabled = elements.urlInput.value.trim() === "";
    elements.editTextArea.value = "";
    updateBrowserURL();
  });

  // Edit textarea handling
  elements.editTextArea.addEventListener("input", () => {
    elements.urlInput.value = "";
    elements.importButton.disabled = elements.urlInput.value.trim() === "";
    updateBrowserURL();
  });

  // Import form handling
  elements.importForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}

function setupCleanupHandlers(): void {
  // Release wake lock when the page is closed or navigated away
  window.addEventListener("beforeunload", releaseWakeLock);
}

// DOM content loaded event handlers
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
