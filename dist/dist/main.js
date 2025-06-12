"use strict";
(() => {
  // src/timer.ts
  var COUNTDOWN_INTERVAL_MS = 1e3;
  var BEEP_INTERVAL_MS = 1300;
  var BEEP_DURATION_S = 0.2;
  var BEEP_FREQUENCY_HZ = 3e3;
  var globalAudioContext = null;
  function getAudioContext() {
    if (!globalAudioContext) {
      try {
        globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
        return null;
      }
    }
    if (globalAudioContext.state === "suspended") {
      globalAudioContext.resume().catch((err) => console.error("Error resuming AudioContext:", err));
    }
    return globalAudioContext;
  }
  function playBeepSound() {
    const context = getAudioContext();
    if (!context) {
      return;
    }
    try {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(BEEP_FREQUENCY_HZ, context.currentTime);
      oscillator.connect(context.destination);
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + BEEP_DURATION_S);
    } catch (error) {
      console.error("Error playing beep sound:", error);
    }
  }
  var activeTimers = /* @__PURE__ */ new Map();
  function formatCountdownTime(totalSeconds) {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    let timeString = "";
    if (minutes > 0) {
      timeString += `${minutes}m `;
    }
    timeString += `${seconds}s`;
    return timeString.trim();
  }
  function stopBeeping(span, timerData) {
    if (timerData.beepIntervalId) {
      clearInterval(timerData.beepIntervalId);
    }
    if (timerData.countdownDisplayElement) {
      span.removeChild(timerData.countdownDisplayElement);
    }
    span.classList.remove("timer-done");
    span.classList.remove("timer-active");
    activeTimers.delete(span);
  }
  function stopCountdown(span, timerData) {
    if (timerData.countdownIntervalId) {
      clearInterval(timerData.countdownIntervalId);
    }
    if (timerData.countdownDisplayElement) {
      span.removeChild(timerData.countdownDisplayElement);
    }
    span.classList.remove("timer-active");
    span.classList.remove("timer-done");
    activeTimers.delete(span);
  }
  function startCountdown(span) {
    const titleAttr = span.getAttribute("title");
    if (!titleAttr || !titleAttr.startsWith("SEC=")) {
      console.warn("Duration span is missing SEC= title attribute.", span);
      return;
    }
    const totalSeconds = parseInt(titleAttr.substring(4), 10);
    if (isNaN(totalSeconds) || totalSeconds <= 0) {
      console.warn("Invalid total seconds for timer:", titleAttr, span);
      return;
    }
    span.classList.remove("timer-done");
    span.classList.add("timer-active");
    let currentRemainingSeconds = totalSeconds;
    let countdownDisplayElement = span.querySelector(".timer-countdown");
    if (!countdownDisplayElement) {
      countdownDisplayElement = document.createElement("span");
      countdownDisplayElement.className = "timer-countdown";
      if (span.textContent && span.textContent.trim() !== "") {
        span.appendChild(document.createTextNode(" "));
      }
      span.appendChild(countdownDisplayElement);
    }
    const finalCountdownDisplayElement = countdownDisplayElement;
    const updateDisplay = () => {
      if (finalCountdownDisplayElement) {
        finalCountdownDisplayElement.textContent = `(${formatCountdownTime(currentRemainingSeconds)} left)`;
      }
    };
    updateDisplay();
    const countdownIntervalId = window.setInterval(() => {
      currentRemainingSeconds--;
      updateDisplay();
      const currentTimerData = activeTimers.get(span);
      if (currentRemainingSeconds <= 0) {
        if (currentTimerData && currentTimerData.countdownIntervalId) {
          clearInterval(currentTimerData.countdownIntervalId);
        }
        span.classList.remove("timer-active");
        span.classList.add("timer-done");
        if (finalCountdownDisplayElement) {
          finalCountdownDisplayElement.textContent = `(TIMER DONE)`;
        }
        playBeepSound();
        const beepIntervalId = window.setInterval(() => {
          playBeepSound();
        }, BEEP_INTERVAL_MS);
        if (currentTimerData) {
          currentTimerData.isDoneAndBeeping = true;
          currentTimerData.beepIntervalId = beepIntervalId;
          currentTimerData.countdownIntervalId = void 0;
        } else {
          activeTimers.set(span, {
            beepIntervalId,
            isDoneAndBeeping: true,
            countdownDisplayElement: finalCountdownDisplayElement
          });
        }
      }
    }, COUNTDOWN_INTERVAL_MS);
    activeTimers.set(span, {
      countdownIntervalId,
      isDoneAndBeeping: false,
      countdownDisplayElement: finalCountdownDisplayElement
    });
  }
  function initializeTimers(viewElement) {
    viewElement.addEventListener("click", (event) => {
      const target = event.target;
      const durationSpan = target.classList.contains("duration") ? target : target.closest(".duration");
      if (durationSpan) {
        const timerData = activeTimers.get(durationSpan);
        if (timerData) {
          if (timerData.isDoneAndBeeping) {
            stopBeeping(durationSpan, timerData);
          } else if (timerData.countdownIntervalId) {
            stopCountdown(durationSpan, timerData);
          } else {
            console.warn(
              "Timer data in inconsistent state, restarting timer:",
              durationSpan,
              timerData
            );
            startCountdown(durationSpan);
          }
        } else {
          startCountdown(durationSpan);
        }
      }
    });
  }

  // src/ui.ts
  var elements = {
    tabButtons: document.querySelectorAll(
      ".tab-button"
    ),
    tabContents: document.querySelectorAll(
      ".tab-content"
    ),
    importButton: document.querySelector("#import button"),
    urlInput: document.querySelector(
      '#import input[type="url"]'
    ),
    editTextArea: document.querySelector("#edit textarea"),
    renderedRecipeView: document.getElementById(
      "renderedRecipeView"
    )
  };
  function switchToTab(tabId, onTabSwitch) {
    elements.tabButtons.forEach((btn) => btn.classList.remove("active"));
    elements.tabContents.forEach((content) => content.classList.remove("active"));
    const buttonToActivate = document.querySelector(
      `.tab-button[data-tab="${tabId}"]`
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
  function initializeUI(onTabSwitchCallback) {
    elements.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tab = button.getAttribute("data-tab");
        if (tab) {
          switchToTab(tab, onTabSwitchCallback);
        }
      });
    });
    const updateImportButtonState = () => {
      elements.importButton.disabled = elements.urlInput.value.trim() === "";
    };
    elements.urlInput.addEventListener("input", updateImportButtonState);
    updateImportButtonState();
  }
  document.addEventListener("DOMContentLoaded", () => {
    const renderedRecipeView = document.getElementById("renderedRecipeView");
    if (renderedRecipeView) {
      initializeTimers(renderedRecipeView);
      renderedRecipeView.addEventListener("click", (event) => {
        const target = event.target;
        const isDurationClick = target.classList.contains("duration") || target.closest(".duration");
        if (isDurationClick) {
          return;
        }
        if (target.tagName === "LI" || target.tagName === "P") {
          target.classList.toggle("strikethrough");
        } else if (target.tagName === "SPAN" && (target.classList.contains("quantity") || target.classList.contains("ingredient"))) {
          const listItem = target.closest("li");
          if (listItem) {
            listItem.classList.toggle("strikethrough");
          }
        }
      });
    }
  });

  // src/parse-duration.ts
  var DURATION_UNITS = [
    {
      name: "SECONDS",
      variations: ["seconds", "second", "sec", "secs"],
      secondsMultiplier: 1
    },
    {
      name: "MINUTES",
      variations: ["minutes", "minute", "min", "mins"],
      secondsMultiplier: 60
    },
    {
      name: "HOURS",
      variations: ["hours", "hour", "hr", "hrs"],
      secondsMultiplier: 3600
    }
  ];
  var UNIT_MULTIPLIERS = /* @__PURE__ */ new Map();
  for (const unit of DURATION_UNITS) {
    for (const variation of unit.variations) {
      UNIT_MULTIPLIERS.set(variation.toLowerCase(), unit.secondsMultiplier);
    }
  }
  function parseDurationToSeconds(durationText, unit) {
    const multiplier = UNIT_MULTIPLIERS.get(unit.toLowerCase()) || 1;
    const rangeMatch = durationText.match(
      /^(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)$/
    );
    if (rangeMatch) {
      const start = parseFloat(rangeMatch[1]);
      return start * multiplier;
    }
    const singleMatch = durationText.match(/^(\d+(?:\.\d+)?)$/);
    if (singleMatch) {
      const value = parseFloat(singleMatch[1]);
      return value * multiplier;
    }
    return 0;
  }
  function createDurationRegex() {
    const allUnits = DURATION_UNITS.flatMap((unit) => unit.variations).sort((a, b) => b.length - a.length).map((unit) => unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const numberPattern = `\\d+(?:\\.\\d+)?`;
    const rangePattern = `(?:\\s*(?:-|to)\\s*${numberPattern})?`;
    const fullPattern = `(${numberPattern}${rangePattern})\\s+(${allUnits.join("|")})\\b`;
    return new RegExp(fullPattern, "gi");
  }
  var DURATION_REGEX = createDurationRegex();
  function annotateDurationsAsHTML(text) {
    return text.replace(DURATION_REGEX, (match, durationPart, unit) => {
      try {
        const seconds = parseDurationToSeconds(durationPart.trim(), unit.trim());
        const formattedSeconds = seconds % 1 === 0 ? seconds.toString() : seconds.toString();
        return `<span class="duration" title="SEC=${formattedSeconds}" data-value="duration:SEC=${formattedSeconds}">${match}</span>`;
      } catch {
        return match;
      }
    });
  }

  // src/parse-ingredient.ts
  var ingredientPatterns = [];
  function loadIngredientDatabase(ingredientsText) {
    ingredientPatterns = createIngredientRegexes(ingredientsText);
  }
  function createRegExpFromIngredientPattern(pattern) {
    let processedPattern = pattern.trim();
    processedPattern = processedPattern.replace(/(\w+)~/g, "$1s?");
    processedPattern = processedPattern.replace(
      /\s+\[([^\]]+)\]/g,
      "(?:\\s+$1)?"
    );
    processedPattern = processedPattern.replace(/\s+/g, "\\s+");
    return new RegExp(`\\b(${processedPattern})\\b`, "i");
  }
  function createIngredientRegexes(ingredientsText) {
    return ingredientsText.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).sort((a, b) => b.length - a.length).map(createRegExpFromIngredientPattern);
  }
  function emphasizeIngredients(line) {
    let highlightedLine = line;
    for (const pattern of ingredientPatterns) {
      const globalPattern = new RegExp(pattern.source, "ig");
      highlightedLine = highlightedLine.replace(
        globalPattern,
        (match) => `<span class="ingredient">${match}</span>`
      );
    }
    return highlightedLine;
  }

  // src/parse-fraction.ts
  var UNICODE_FRACTIONS = /* @__PURE__ */ new Map([
    ["\xBC", 0.25],
    ["\xBD", 0.5],
    ["\xBE", 0.75],
    ["\u2150", 1 / 7],
    ["\u2151", 1 / 9],
    ["\u2152", 0.1],
    ["\u2153", 1 / 3],
    ["\u2154", 2 / 3],
    ["\u2155", 0.2],
    ["\u2156", 0.4],
    ["\u2157", 0.6],
    ["\u2158", 0.8],
    ["\u2159", 1 / 6],
    ["\u215A", 5 / 6],
    ["\u215B", 0.125],
    ["\u215C", 0.375],
    ["\u215D", 0.625],
    ["\u215E", 0.875]
  ]);
  function parseFraction(text) {
    if (!text || typeof text !== "string") {
      throw new Error("Invalid input: text must be a non-empty string");
    }
    const normalized = text.trim().replace(/\s+/g, " ");
    if (!normalized) {
      throw new Error("Invalid input: empty string");
    }
    for (const [fraction, value] of UNICODE_FRACTIONS) {
      if (normalized.includes(fraction)) {
        const mixedMatch2 = normalized.match(
          new RegExp(`^(\\d+)\\s*${escapeRegExp(fraction)}$`)
        );
        if (mixedMatch2) {
          const whole = parseInt(mixedMatch2[1], 10);
          return whole + value;
        }
        if (normalized === fraction) {
          return value;
        }
      }
    }
    const mixedMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseInt(mixedMatch[1], 10);
      const numerator = parseInt(mixedMatch[2], 10);
      const denominator = parseInt(mixedMatch[3], 10);
      if (denominator === 0) {
        throw new Error("Division by zero in fraction");
      }
      return whole + numerator / denominator;
    }
    const fractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
      const numerator = parseInt(fractionMatch[1], 10);
      const denominator = parseInt(fractionMatch[2], 10);
      if (denominator === 0) {
        throw new Error("Division by zero in fraction");
      }
      return numerator / denominator;
    }
    const decimalMatch = normalized.match(/^(\d+(?:\.\d+)?)$/);
    if (decimalMatch) {
      return parseFloat(decimalMatch[1]);
    }
    throw new Error(`Invalid number format: ${text}`);
  }
  function createNumberPattern() {
    const unicodeFractions = Array.from(UNICODE_FRACTIONS.keys()).map(escapeRegExp).join("");
    const patterns = [
      `\\d+\\s*[${unicodeFractions}]`,
      // Mixed Unicode fractions (1½)
      `[${unicodeFractions}]`,
      // Pure Unicode fractions (½)
      `\\d+\\s+\\d+/\\d+`,
      // Mixed regular fractions (1 1/2)
      `\\d+/\\d+`,
      // Simple fractions (1/2)
      `\\d+(?:\\.\\d+)?`
      // Decimal numbers (1 or 1.23)
    ];
    return new RegExp(`(?:${patterns.join("|")})`, "g");
  }
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // src/round-satisfying.ts
  function roundSatisfying(x, tolerance = 0.05) {
    if (x == null) {
      throw new Error("x cannot be null or undefined");
    }
    if (x < 0) {
      throw new Error("x must be >= 0.0");
    }
    if (tolerance < 0 || tolerance >= 1) {
      throw new Error("tolerance must be between 0.0 and 1.0 (exclusive)");
    }
    if (x === 0) {
      return 0;
    }
    const precision = -Math.floor(Math.log10(tolerance));
    const lowerBound = x * (1 - tolerance);
    const upperBound = x * (1 + tolerance);
    const power = Math.floor(Math.log10(x));
    const factors = [1, 0.5, 0.25, 0.1, 0.05];
    const allCandidates = [];
    for (const factor of factors) {
      const step = factor * Math.pow(10, power);
      const start = Math.floor(lowerBound / step);
      const end = Math.ceil(upperBound / step);
      for (let i = start; i <= end; i++) {
        const candidate = parseFloat((i * step).toFixed(precision));
        if (lowerBound <= candidate && candidate <= upperBound) {
          if (!allCandidates.includes(candidate)) {
            allCandidates.push(candidate);
          }
        }
      }
    }
    if (allCandidates.length > 0) {
      const best = allCandidates.reduce(
        (closest, current) => Math.abs(current - x) < Math.abs(closest - x) ? current : closest
      );
      if (Number.isInteger(best)) {
        return Math.round(best);
      }
      return best;
    }
    return parseFloat(x.toFixed(precision));
  }

  // src/units.ts
  var UNIT_DEFINITIONS = [
    {
      key: "TSP",
      variations: ["teaspoons", "teaspoon", "tsp"],
      displayName: "teaspoons",
      type: "US_VOLUME",
      to_l: 5e-3
    },
    {
      key: "TBSP",
      variations: ["tablespoons", "tablespoon", "tbsp"],
      displayName: "tablespoons",
      type: "US_VOLUME",
      to_l: 0.015
    },
    {
      key: "US_FLOZ",
      variations: ["fl oz", "fl. oz.", "fluid ounces", "fluid ounce"],
      displayName: "fl oz",
      type: "US_VOLUME",
      to_l: 0.02957
    },
    {
      key: "US_CUP",
      variations: ["cup", "cups"],
      displayName: "cup",
      type: "US_VOLUME",
      to_l: 0.23659
    },
    {
      key: "US_PINT",
      variations: ["pt", "pint", "pints"],
      displayName: "pt",
      type: "US_VOLUME",
      to_l: 0.47318
    },
    {
      key: "US_QT",
      variations: ["qt", "quart", "quarts"],
      displayName: "qt",
      type: "US_VOLUME",
      to_l: 0.94635
    },
    {
      key: "US_GAL",
      variations: ["gal", "gal.", "gallon", "gallons"],
      displayName: "gal",
      type: "US_VOLUME",
      to_l: 3.78541
    },
    {
      key: "US_OZ",
      variations: ["oz", "ounce", "ounces"],
      displayName: "oz",
      type: "US_MASS",
      to_kg: 0.02835
    },
    {
      key: "US_LB",
      variations: ["lb", "pound", "pound"],
      displayName: "lb",
      type: "US_MASS",
      to_kg: 0.45359
    },
    {
      key: "METRIC_ML",
      variations: ["ml", "milliliter", "milliliters"],
      displayName: "ml",
      type: "METRIC_VOLUME",
      to_l: 1e-3
    },
    {
      key: "METRIC_L",
      variations: ["l", "liter", "liters"],
      displayName: "l",
      type: "METRIC_VOLUME",
      to_l: 1
    },
    {
      key: "METRIC_G",
      variations: ["g", "gram", "grams"],
      displayName: "g",
      type: "METRIC_MASS",
      to_kg: 1e-3
    },
    {
      key: "METRIC_KG",
      variations: ["kg", "kilogram", "kilograms"],
      displayName: "kg",
      type: "METRIC_MASS",
      to_kg: 1
    }
  ];
  function convertMeasurement(value, sourceUnit, targetUnit) {
    if (!sourceUnit || !targetUnit) {
      throw new Error(`Invalid unit: ${sourceUnit?.key} or ${targetUnit?.key}`);
    }
    const sourceType = sourceUnit.type.split("_")[1];
    const targetType = targetUnit.type.split("_")[1];
    if (sourceType !== targetType) {
      throw new Error(`Can't convert ${sourceUnit.key} to ${targetUnit.key}`);
    }
    let baseValue;
    let convertedValue;
    if (sourceUnit.to_l && targetUnit.to_l) {
      baseValue = value * sourceUnit.to_l;
      convertedValue = baseValue / targetUnit.to_l;
    } else if (sourceUnit.to_kg && targetUnit.to_kg) {
      baseValue = value * sourceUnit.to_kg;
      convertedValue = baseValue / targetUnit.to_kg;
    } else {
      throw new Error(
        `Incompatible units: ${sourceUnit.key} and ${targetUnit.key}`
      );
    }
    return [convertedValue, targetUnit];
  }
  function getOptimalUnit(value, currentUnit, system) {
    if (!currentUnit) {
      throw new Error(`Invalid unit provided to getOptimalUnit`);
    }
    if (currentUnit.key === "TSP" || currentUnit.key === "TBSP") {
      return currentUnit;
    }
    const initialSystem = currentUnit.type.startsWith("METRIC") ? "METRIC" : "US";
    const targetSystem = system || initialSystem;
    const baseValue = value * (currentUnit.to_kg || currentUnit.to_l || 1);
    const measurementType = currentUnit.type.split("_")[1];
    const targetType = `${targetSystem}_${measurementType}`;
    const sortKey = currentUnit.to_l ? "to_l" : "to_kg";
    const compatibleUnits = UNIT_DEFINITIONS.filter(
      (unit) => unit.type === targetType && (sortKey === "to_l" ? unit.to_l : unit.to_kg)
    ).sort((a, b) => {
      const aFactor = sortKey === "to_l" ? a.to_l : a.to_kg;
      const bFactor = sortKey === "to_l" ? b.to_l : b.to_kg;
      return aFactor - bFactor;
    });
    let optimalUnit = currentUnit;
    let foundOptimalUnit = false;
    for (const unit of compatibleUnits) {
      const factor = sortKey === "to_l" ? unit.to_l : unit.to_kg;
      if (baseValue / factor >= 1) {
        optimalUnit = unit;
        foundOptimalUnit = true;
      } else {
        break;
      }
    }
    if (!foundOptimalUnit && compatibleUnits.length > 0) {
      optimalUnit = compatibleUnits[0];
    }
    return optimalUnit;
  }

  // src/parse-quantity.ts
  var UNIT_LOOKUP = /* @__PURE__ */ new Map();
  for (const unit of UNIT_DEFINITIONS) {
    for (const variation of unit.variations) {
      UNIT_LOOKUP.set(variation.toLowerCase(), unit.key);
    }
  }
  function createQuantityRegex() {
    const allVariations = UNIT_DEFINITIONS.flatMap(
      (unit) => unit.variations
    ).sort((a, b) => b.length - a.length).map(
      (variation) => variation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const numberPatternSource = createNumberPattern().source;
    const pattern = `(${numberPatternSource})\\s*\\b(${allVariations.join("|")})\\b`;
    return new RegExp(pattern, "gi");
  }
  var QUANTITY_REGEX = createQuantityRegex();
  function annotateQuantitiesAsHTML(line, shouldConvertToMetric = false, shouldRoundSatisfyingParam) {
    return line.replace(QUANTITY_REGEX, (match, numberPart, unitString) => {
      const unitKey = UNIT_LOOKUP.get(unitString.toLowerCase());
      if (!unitKey) {
        return match;
      }
      const originalUnit = UNIT_DEFINITIONS.find(
        (unit) => unit.key === unitKey
      );
      if (!originalUnit) {
        return match;
      }
      try {
        const originalValue = parseFraction(numberPart.trim());
        let finalValue = originalValue;
        let finalUnit = originalUnit;
        const applyRounding = shouldRoundSatisfyingParam === void 0 ? shouldConvertToMetric : shouldRoundSatisfyingParam;
        if (shouldConvertToMetric) {
          if (originalUnit.key.startsWith("METRIC_")) {
            finalValue = originalValue;
            finalUnit = originalUnit;
          } else {
            try {
              let baseMetricUnit;
              if (originalUnit.to_l) {
                baseMetricUnit = UNIT_DEFINITIONS.find(
                  (u) => u.key === "METRIC_L"
                );
              } else if (originalUnit.to_kg) {
                baseMetricUnit = UNIT_DEFINITIONS.find(
                  (u) => u.key === "METRIC_KG"
                );
              } else {
                return match;
              }
              const [baseValue, baseUnit] = convertMeasurement(
                originalValue,
                originalUnit,
                baseMetricUnit
              );
              const optimalUnit = getOptimalUnit(baseValue, baseUnit, "METRIC");
              if (optimalUnit.key !== baseUnit.key) {
                const [optimalValue, optimalUnitResult] = convertMeasurement(
                  baseValue,
                  baseUnit,
                  optimalUnit
                );
                finalValue = optimalValue;
                finalUnit = optimalUnitResult;
              } else {
                finalValue = baseValue;
                finalUnit = baseUnit;
              }
              if (applyRounding) {
                finalValue = roundSatisfying(finalValue);
              } else {
                finalValue = parseFloat(finalValue.toFixed(7));
              }
            } catch (error) {
              return match;
            }
          }
        }
        let quantityValue = `${originalUnit.key}=${originalValue}`;
        let outHtml = `<span class="quantity" title="${quantityValue}" data-value="quantity:${quantityValue}">${match}</span>`;
        if (shouldConvertToMetric && finalUnit.key !== originalUnit.key) {
          quantityValue = `${finalUnit.key}=${finalValue}`;
          outHtml += ` <span class="quantity-metric" title="${quantityValue}" data-value="quantity:${quantityValue}">(${finalValue} ${finalUnit.displayName})</span>`;
          return outHtml;
        } else {
          return outHtml;
        }
      } catch {
        return match;
      }
    });
  }

  // src/parser.ts
  function formatIsoDuration(isoDuration) {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?/;
    const matches = isoDuration.match(regex);
    if (!matches) return isoDuration;
    const hours = matches[1] ? parseInt(matches[1], 10) : 0;
    const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
    const parts = [];
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    return parts.join(" ");
  }
  function convertJsonLdToRecipeMarkdown(recipeJson) {
    const markdownParts = [];
    if (recipeJson.image) {
      let imageUrl;
      if (typeof recipeJson.image === "string") imageUrl = recipeJson.image;
      else if (Array.isArray(recipeJson.image)) {
        const firstImage = recipeJson.image[0];
        if (typeof firstImage === "string") imageUrl = firstImage;
        else if (typeof firstImage === "object" && firstImage.url)
          imageUrl = firstImage.url;
      } else if (typeof recipeJson.image === "object" && recipeJson.image.url) {
        imageUrl = recipeJson.image.url;
      }
      if (imageUrl) markdownParts.push(`![Recipe Image](${imageUrl})
`);
    }
    if (recipeJson.name) markdownParts.push(`# ${recipeJson.name}
`);
    if (recipeJson.description) markdownParts.push(`${recipeJson.description}
`);
    if (recipeJson.author) {
      const authorName = typeof recipeJson.author === "string" ? recipeJson.author : recipeJson.author.name || Array.isArray(recipeJson.author) && recipeJson.author[0].name;
      if (authorName) markdownParts.push(`_By: ${authorName}_
`);
    }
    const metadataLines = [];
    if (recipeJson.prepTime)
      metadataLines.push(
        `**Prep Time:** ${formatIsoDuration(recipeJson.prepTime)}`
      );
    if (recipeJson.cookTime)
      metadataLines.push(
        `**Cook Time:** ${formatIsoDuration(recipeJson.cookTime)}`
      );
    if (recipeJson.totalTime)
      metadataLines.push(
        `**Total Time:** ${formatIsoDuration(recipeJson.totalTime)}`
      );
    if (recipeJson.recipeYield) {
      const servings = Array.isArray(recipeJson.recipeYield) ? recipeJson.recipeYield.join(", ") : recipeJson.recipeYield;
      metadataLines.push(`**Servings:** ${servings}`);
    }
    if (recipeJson.recipeCategory)
      metadataLines.push(`**Category:** ${recipeJson.recipeCategory}`);
    if (recipeJson.recipeCuisine)
      metadataLines.push(`**Cuisine:** ${recipeJson.recipeCuisine}`);
    if (metadataLines.length > 0)
      markdownParts.push("\n" + metadataLines.join("\n"));
    markdownParts.push("\n---\n");
    if (recipeJson.recipeIngredient && Array.isArray(recipeJson.recipeIngredient)) {
      markdownParts.push("## Ingredients\n");
      markdownParts.push(
        recipeJson.recipeIngredient.map((i) => `- ${i.trim()}`).join("\n") + "\n"
      );
    }
    if (recipeJson.recipeInstructions && Array.isArray(recipeJson.recipeInstructions)) {
      markdownParts.push("## Instructions\n");
      markdownParts.push(
        recipeJson.recipeInstructions.map(
          (s, i) => `${i + 1}. ${(typeof s === "object" && s.text ? s.text : s).trim()}`
        ).join("\n") + "\n"
      );
    }
    return markdownParts.join("\n");
  }
  function markdownToHtml(markdown) {
    let html = markdown;
    html = html.replace(/(^|\W)\*\*(.*?)\*\*(\W|$)/g, "$1<strong>$2</strong>$3");
    html = html.replace(/(^|\W)_(.*?)_(\W|$)/g, "$1<em>$2</em>$3");
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
    html = html.replace(/^---\s*$/gm, "<hr>");
    html = html.replace(/^>\s*(.*)$/gm, "<blockquote>$1</blockquote>");
    html = html.replace(/^##\s*(.*)$/gm, "<h2>$1</h2>");
    html = html.replace(/^#\s*(.*)$/gm, "<h1>$1</h1>");
    html = html.replace(/^- (.*)$/gm, (_match, content) => {
      const annotatedContent = emphasizeIngredients(
        annotateDurationsAsHTML(annotateQuantitiesAsHTML(content, true, true))
      );
      return `<li class="unordered">${annotatedContent}</li>`;
    });
    html = html.replace(/^\d+\.\s*(.*)$/gm, (_match, content) => {
      const annotatedContent = emphasizeIngredients(
        annotateDurationsAsHTML(annotateQuantitiesAsHTML(content, true, true))
      );
      return `<li class="ordered">${annotatedContent}</li>`;
    });
    html = html.replace(/((?:<li class="unordered">.*<\/li>\n?)+)/g, (match) => {
      const cleanMatch = match.replace(/ class="unordered"/g, "");
      return `<ul>
${cleanMatch}</ul>`;
    });
    html = html.replace(/((?:<li class="ordered">.*<\/li>\n?)+)/g, (match) => {
      const cleanMatch = match.replace(/ class="ordered"/g, "");
      return `<ol>
${cleanMatch}</ol>`;
    });
    html = html.replace(/\n{2,}/g, "\n\n");
    html = html.split("\n\n").map((paragraph) => {
      if (!paragraph.match(/<(h[1-6]|ul|ol|blockquote|hr|p|img)>/i)) {
        return `<p>${paragraph.replace(/\n/g, "<br>")}</p>`;
      }
      return paragraph;
    }).join("\n\n");
    return html;
  }

  // src/main.ts
  function handleTabSwitch(tabId) {
    if (tabId === "view") {
      const markdown = elements.editTextArea.value;
      elements.renderedRecipeView.innerHTML = markdownToHtml(markdown);
    }
  }
  async function handleImport() {
    const targetUrl = elements.urlInput.value.trim();
    if (!targetUrl) return;
    elements.importButton.textContent = "Importing...";
    elements.importButton.disabled = true;
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const jsonLdScript = doc.querySelector(
        'script[type="application/ld+json"]'
      );
      if (!jsonLdScript?.textContent) {
        throw new Error("No JSON-LD script tag found on the page.");
      }
      const data = JSON.parse(jsonLdScript.textContent);
      const recipeJson = Array.isArray(data["@graph"]) ? data["@graph"].find((item) => item["@type"]?.includes("Recipe")) : data["@type"]?.includes("Recipe") ? data : null;
      if (recipeJson) {
        const recipeMarkdown = convertJsonLdToRecipeMarkdown(recipeJson);
        elements.editTextArea.value = recipeMarkdown;
        switchToTab("edit", handleTabSwitch);
      } else {
        const errorMessage = "Import failed: No Schema.org/Recipe JSON-LD data found on that page.";
        console.error(errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Import failed:", errorMessage);
      alert(`Import failed: ${errorMessage}`);
    } finally {
      elements.importButton.textContent = "Import";
      elements.importButton.disabled = false;
    }
  }
  async function initializeApp() {
    try {
      const response = await fetch("ingredients-en.txt");
      if (!response.ok) {
        throw new Error("Failed to load ingredients.txt");
      }
      const ingredientsText = await response.text();
      loadIngredientDatabase(ingredientsText);
      initializeUI(handleTabSwitch);
      elements.importButton.addEventListener("click", handleImport);
    } catch (error) {
      console.error("Failed to initialize application:", error);
      alert(
        "Could not initialize the application. Please ensure ingredients-en.txt is available and reload the page."
      );
    }
  }
  initializeApp();
})();
