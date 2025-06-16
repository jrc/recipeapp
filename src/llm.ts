// recipeapp/src/llm.ts

/**
 * llm.ts
 * Handles interaction with the Google Gemini API and API key management.
 */

const GEMINI_API_KEY_STORAGE_KEY = "geminiApiKey";
const GEMINI_MODEL_NAME = "gemini-2.0-flash"; // Constant for the model name

// API URL using the model name constant.
const GEMINI_API_URL_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=`;

// --- API Key Management ---

/**
 * Retrieves the Gemini API key from localStorage.
 * @returns The API key string, or null if not found.
 */
export function getGeminiApiKey(): string | null {
  return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
}

/**
 * Saves the Gemini API key to localStorage.
 * @param apiKey The API key string to save.
 */
export function setGeminiApiKey(apiKey: string): void {
  localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey);
}

// --- Gemini API Interaction ---

// Simplified interfaces based on common Gemini API request/response structures.
// Refer to official Google Gemini API documentation for the most accurate and complete types.
interface GeminiRequestPayload {
  contents: {
    parts: { text: string }[];
  }[];
  // generationConfig and safetySettings could be added here if needed.
}

interface GeminiResponsePart {
  text: string;
}

interface GeminiResponseContent {
  parts: GeminiResponsePart[];
  role: string;
}

interface GeminiResponseCandidate {
  content: GeminiResponseContent;
  finishReason?: string;
  index?: number;
  safetyRatings?: {
    category: string;
    probability: string;
  }[];
}

interface GeminiApiErrorDetail {
  code: number;
  message: string;
  status: string;
}

interface GeminiApiResponse {
  candidates?: GeminiResponseCandidate[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: {
      category: string;
      probability: string;
    }[];
  };
  error?: GeminiApiErrorDetail; // For API-level errors returned in the JSON body
}

/**
 * Transforms the given recipe content using the Gemini API with the provided prompt.
 *
 * @param apiKey The Gemini API key.
 * @param userPrompt The user-defined prompt for the transformation.
 * @param recipeContent The current recipe text (Markdown).
 * @returns A Promise that resolves with the transformed recipe string.
 * @throws An error if the API call fails or the response is invalid.
 */
export async function transformRecipeWithLLM(
  apiKey: string,
  userPrompt: string,
  recipeContent: string,
): Promise<string> {
  if (!apiKey.trim()) {
    const noApiKeyMsg = "Gemini API Key is missing. Please enter it above.";
    alert(noApiKeyMsg);
    throw new Error(noApiKeyMsg);
  }

  const fullPrompt = `You are an expert recipe assistant. The user wants to modify a recipe.
User's request: "${userPrompt}"

Current Recipe (in Markdown format):
---
${recipeContent}
---

Provide ONLY the complete, updated recipe in Markdown format, based on the user's request. Do not include any conversational preamble or explanation, just the recipe.`;

  const payload: GeminiRequestPayload = {
    contents: [
      {
        parts: [{ text: fullPrompt }],
      },
    ],
  };

  try {
    const response = await fetch(`${GEMINI_API_URL_BASE}${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData: GeminiApiResponse = await response.json();

    if (!response.ok) {
      const errorMessage =
        responseData.error?.message ||
        response.statusText ||
        `API request failed with status ${response.status}`;
      const alertMessage = `Error from Gemini API: ${errorMessage}`;
      alert(alertMessage);
      throw new Error(`Gemini API request failed: ${errorMessage}`); // Throwing a more concise error for internal handling
    }

    if (responseData.promptFeedback?.blockReason) {
      let blockMessage = `Gemini blocked the request. Reason: ${responseData.promptFeedback.blockReason}.`;
      if (responseData.promptFeedback.safetyRatings) {
        const problematicCategories = responseData.promptFeedback.safetyRatings
          .filter(
            (sr) => sr.probability !== "NEGLIGIBLE" && sr.probability !== "LOW",
          )
          .map((sr) => sr.category)
          .join(", ");
        if (problematicCategories) {
          blockMessage += ` Problematic categories: ${problematicCategories}.`;
        }
      }
      alert(blockMessage);
      throw new Error(blockMessage);
    }

    if (responseData.candidates && responseData.candidates.length > 0) {
      const firstCandidate = responseData.candidates[0];
      if (
        firstCandidate.content &&
        firstCandidate.content.parts &&
        firstCandidate.content.parts.length > 0
      ) {
        let transformedText = firstCandidate.content.parts
          .map((part) => part.text)
          .join("");

        transformedText = transformedText.trim(); // Overall trim first

        if (transformedText.startsWith("---\n")) {
          transformedText = transformedText.substring(4);
        }
        if (transformedText.endsWith("\n---")) {
          transformedText = transformedText.substring(
            0,
            transformedText.length - 4,
          );
        }

        // Also trim again in case stripping revealed new whitespace.
        transformedText = transformedText.trim();

        return transformedText; // Final state
      }
    }

    const noContentMsg =
      "Gemini API returned a successful response, but it did not contain the expected recipe content. The prompt might have been filtered or the model generated an empty response.";
    alert(noContentMsg);
    throw new Error(noContentMsg);
  } catch (error) {
    // The try block now handles all specific alerts.
    // Errors from fetch() or response.json() that are not caught by specific checks in the try block
    // (e.g., network errors, malformed JSON that isn't an API error response)
    // will be caught here and re-thrown without an additional alert from this function.
    // The caller is responsible for handling these re-thrown errors.
    // Re-throw the original error so the caller can also handle it (e.g., update UI state like stopping a spinner).
    throw error;
  }
}
