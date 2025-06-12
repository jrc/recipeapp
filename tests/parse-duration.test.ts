import { annotateDurationsAsHTML } from "../src/parse-duration";

function testAnnotateDurations() {
  // Test basic units
  let result = annotateDurationsAsHTML("Cook for about 5 minutes.");
  console.assert(
    result ===
      'Cook for about <span class="duration" title="SEC=300" data-value="duration:SEC=300">5 minutes</span>.',
    "Should annotate minutes correctly",
  );

  result = annotateDurationsAsHTML("The meeting will last for 2 hours.");
  console.assert(
    result ===
      'The meeting will last for <span class="duration" title="SEC=7200" data-value="duration:SEC=7200">2 hours</span>.',
    "Should annotate hours correctly",
  );

  result = annotateDurationsAsHTML("Wait for 30 seconds.");
  console.assert(
    result ===
      'Wait for <span class="duration" title="SEC=30" data-value="duration:SEC=30">30 seconds</span>.',
    "Should annotate seconds correctly",
  );

  // Test singular forms
  result = annotateDurationsAsHTML("Cook for 1 minute.");
  console.assert(
    result ===
      'Cook for <span class="duration" title="SEC=60" data-value="duration:SEC=60">1 minute</span>.',
    "Should annotate singular minute correctly",
  );

  result = annotateDurationsAsHTML("Wait 1 hour.");
  console.assert(
    result ===
      'Wait <span class="duration" title="SEC=3600" data-value="duration:SEC=3600">1 hour</span>.',
    "Should annotate singular hour correctly",
  );

  result = annotateDurationsAsHTML("Pause for 1 second.");
  console.assert(
    result ===
      'Pause for <span class="duration" title="SEC=1" data-value="duration:SEC=1">1 second</span>.',
    "Should annotate singular second correctly",
  );

  // Test multiple durations
  result = annotateDurationsAsHTML("Exercise for 1 hour and 30 minutes.");
  console.assert(
    result ===
      'Exercise for <span class="duration" title="SEC=3600" data-value="duration:SEC=3600">1 hour</span> and <span class="duration" title="SEC=1800" data-value="duration:SEC=1800">30 minutes</span>.',
    "Should annotate multiple durations correctly",
  );

  // Test range durations
  result = annotateDurationsAsHTML(
    "Cover tightly with foil and bake for 35-40 minutes.",
  );
  console.assert(
    result ===
      'Cover tightly with foil and bake for <span class="duration" title="SEC=2100" data-value="duration:SEC=2100">35-40 minutes</span>.',
    "Should annotate range with dash correctly",
  );

  result = annotateDurationsAsHTML("continue to boil for 3 - 4 minutes.");
  console.assert(
    result ===
      'continue to boil for <span class="duration" title="SEC=180" data-value="duration:SEC=180">3 - 4 minutes</span>.',
    "Should annotate range with spaced dash correctly",
  );

  result = annotateDurationsAsHTML(
    "Keep turning as the liquid reduces to a shiny glaze, 10 to 12 minutes.",
  );
  console.assert(
    result ===
      'Keep turning as the liquid reduces to a shiny glaze, <span class="duration" title="SEC=600" data-value="duration:SEC=600">10 to 12 minutes</span>.',
    "Should annotate range with 'to' correctly",
  );

  // Test decimal durations
  result = annotateDurationsAsHTML("about 1.5 minutes.");
  console.assert(
    result ===
      'about <span class="duration" title="SEC=90" data-value="duration:SEC=90">1.5 minutes</span>.',
    "Should annotate decimal durations correctly",
  );

  // Test abbreviations
  result = annotateDurationsAsHTML("Cook for 5 min.");
  console.assert(
    result ===
      'Cook for <span class="duration" title="SEC=300" data-value="duration:SEC=300">5 min</span>.',
    "Should annotate min abbreviation correctly",
  );

  result = annotateDurationsAsHTML("Wait 30 sec.");
  console.assert(
    result ===
      'Wait <span class="duration" title="SEC=30" data-value="duration:SEC=30">30 sec</span>.',
    "Should annotate sec abbreviation correctly",
  );

  result = annotateDurationsAsHTML("Meet for 2 hrs.");
  console.assert(
    result ===
      'Meet for <span class="duration" title="SEC=7200" data-value="duration:SEC=7200">2 hrs</span>.',
    "Should annotate hrs abbreviation correctly",
  );

  // Test edge cases
  result = annotateDurationsAsHTML("");
  console.assert(result === "", "Should handle empty string");

  result = annotateDurationsAsHTML("Just a normal sentence.");
  console.assert(
    result === "Just a normal sentence.",
    "Should handle text with no durations",
  );

  result = annotateDurationsAsHTML(
    "Cook for 5-10 minutes, then rest for 15 to 20 minutes.",
  );
  console.assert(
    result ===
      'Cook for <span class="duration" title="SEC=300" data-value="duration:SEC=300">5-10 minutes</span>, then rest for <span class="duration" title="SEC=900" data-value="duration:SEC=900">15 to 20 minutes</span>.',
    "Should handle multiple ranges correctly",
  );

  // Test case insensitivity
  result = annotateDurationsAsHTML("5 Minutes and 30 SECONDS");
  console.assert(
    result ===
      '<span class="duration" title="SEC=300" data-value="duration:SEC=300">5 Minutes</span> and <span class="duration" title="SEC=30" data-value="duration:SEC=30">30 SECONDS</span>',
    "Should handle mixed case units",
  );

  // Test large numbers
  result = annotateDurationsAsHTML("Ferment for 72 hours");
  console.assert(
    result ===
      'Ferment for <span class="duration" title="SEC=259200" data-value="duration:SEC=259200">72 hours</span>',
    "Should handle large durations",
  );

  // Test zero values
  result = annotateDurationsAsHTML("0 minutes");
  console.assert(
    result ===
      '<span class="duration" title="SEC=0" data-value="duration:SEC=0">0 minutes</span>',
    "Should handle zero values",
  );

  // Test word boundaries - these should NOT match
  result = annotateDurationsAsHTML("The minutes of the meeting");
  console.assert(
    result === "The minutes of the meeting",
    "Should not match 'minutes' when not preceded by a number",
  );

  result = annotateDurationsAsHTML("secondary issues");
  console.assert(
    result === "secondary issues",
    "Should not match 'sec' in 'secondary'",
  );
}

export function runParseDurationTests() {
  testAnnotateDurations();

  console.log("parse-duration tests completed.");
}
