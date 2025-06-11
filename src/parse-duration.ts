/**
 * parse-duration.ts
 * Handles parsing of time durations and converting them to HTML annotations.
 */

interface DurationUnit {
  name: string;
  variations: string[];
  secondsMultiplier: number;
}

// Duration unit definitions
const DURATION_UNITS: DurationUnit[] = [
  {
    name: "SECONDS",
    variations: ["seconds", "second", "sec", "secs"],
    secondsMultiplier: 1,
  },
  {
    name: "MINUTES",
    variations: ["minutes", "minute", "min", "mins"],
    secondsMultiplier: 60,
  },
  {
    name: "HOURS",
    variations: ["hours", "hour", "hr", "hrs"],
    secondsMultiplier: 3600,
  },
];

// Build lookup map from unit variation to multiplier
const UNIT_MULTIPLIERS = new Map<string, number>();
for (const unit of DURATION_UNITS) {
  for (const variation of unit.variations) {
    UNIT_MULTIPLIERS.set(variation.toLowerCase(), unit.secondsMultiplier);
  }
}

/**
 * Parses a duration string and converts it to seconds.
 * Handles single values, ranges, and decimal numbers.
 *
 * @param durationText Duration string like "5 minutes", "2-3 hours", "1.5 seconds"
 * @param unit The time unit (seconds, minutes, hours)
 * @returns Duration in seconds
 */
function parseDurationToSeconds(durationText: string, unit: string): number {
  const multiplier = UNIT_MULTIPLIERS.get(unit.toLowerCase()) || 1;

  // Handle ranges: "5-10", "5 - 10", "5 to 10"
  const rangeMatch = durationText.match(
    /^(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)$/,
  );
  if (rangeMatch) {
    const start = parseFloat(rangeMatch[1]);
    // For ranges, use the lower bound
    return start * multiplier;
  }

  // Handle single values including decimals
  const singleMatch = durationText.match(/^(\d+(?:\.\d+)?)$/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1]);
    return value * multiplier;
  }

  return 0;
}

/**
 * Creates a regex pattern that matches duration phrases.
 * Matches patterns like "5 minutes", "2-3 hours", "1.5 seconds", "10 to 12 minutes"
 */
function createDurationRegex(): RegExp {
  // Get all unit variations, sorted by length (longest first)
  const allUnits = DURATION_UNITS.flatMap((unit) => unit.variations)
    .sort((a, b) => b.length - a.length)
    .map((unit) => unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); // Escape special chars

  // Pattern components:
  // 1. Number (with optional decimal): \d+(?:\.\d+)?
  // 2. Optional range separator: (?:\s*(?:-|to)\s*\d+(?:\.\d+)?)?
  // 3. Space: \s+
  // 4. Unit: (units...)
  // 5. Word boundary: \b
  const numberPattern = `\\d+(?:\\.\\d+)?`;
  const rangePattern = `(?:\\s*(?:-|to)\\s*${numberPattern})?`;
  const fullPattern = `(${numberPattern}${rangePattern})\\s+(${allUnits.join("|")})\\b`;

  return new RegExp(fullPattern, "gi");
}

const DURATION_REGEX = createDurationRegex();

/**
 * Finds duration patterns in text and wraps them with HTML spans.
 * Handles single durations, ranges, and decimal values.
 *
 * @param text Input text that may contain duration patterns
 * @returns HTML string with durations wrapped in <span class="duration"> elements
 *
 * @example
 * annotateDurationsAsHTML("Cook for 5 minutes")
 * // Returns: 'Cook for <span class="duration" title="duration:300" data-value="duration:300">5 minutes</span>'
 *
 * annotateDurationsAsHTML("Bake for 35-40 minutes")
 * // Returns: 'Bake for <span class="duration" title="duration:2100" data-value="duration:2100">35-40 minutes</span>'
 */
export function annotateDurationsAsHTML(text: string): string {
  return text.replace(DURATION_REGEX, (match, durationPart, unit) => {
    try {
      const seconds = parseDurationToSeconds(durationPart.trim(), unit.trim());

      // Format seconds appropriately (remove .0 for whole numbers)
      const formattedSeconds =
        seconds % 1 === 0 ? seconds.toString() : seconds.toString();

      return `<span class="duration" title="SEC=${formattedSeconds}" data-value="duration:SEC=${formattedSeconds}">${match}</span>`;
    } catch {
      // If parsing fails, return original match
      return match;
    }
  });
}

/**
 * Extracts all durations from text and returns them as an array of objects.
 * Useful for analysis or processing of recipe timing.
 *
 * @param text Input text to search for durations
 * @returns Array of duration objects with original text and seconds value
 *
 * @example
 * extractDurations("Cook for 5 minutes, then rest 2 hours")
 * // Returns: [
 * //   { text: "5 minutes", seconds: 300 },
 * //   { text: "2 hours", seconds: 7200 }
 * // ]
 */
export function extractDurations(
  text: string,
): Array<{ text: string; seconds: number }> {
  const durations: Array<{ text: string; seconds: number }> = [];

  text.replace(DURATION_REGEX, (match, durationPart, unit) => {
    try {
      const seconds = parseDurationToSeconds(durationPart.trim(), unit.trim());
      durations.push({ text: match, seconds });
    } catch {
      // Skip invalid durations
    }
    return match; // We don't actually want to replace, just extract
  });

  return durations;
}

// /**
//  * Converts seconds to a human-readable duration string.
//  *
//  * @param seconds Duration in seconds
//  * @returns Human-readable string like "5 minutes", "1 hour 30 minutes"
//  */
// export function formatDuration(seconds: number): string {
//   if (seconds === 0) return "0 seconds";

//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
//   const remainingSeconds = seconds % 60;

//   const parts: string[] = [];

//   if (hours > 0) {
//     parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
//   }

//   if (minutes > 0) {
//     parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
//   }

//   if (remainingSeconds > 0 && hours === 0) { // Only show seconds if no hours
//     const formatted = remainingSeconds % 1 === 0 ? remainingSeconds.toString() : remainingSeconds.toFixed(1);
//     parts.push(`${formatted} ${remainingSeconds === 1 ? 'second' : 'seconds'}`);
//   }

//   return parts.join(' ');
// }
