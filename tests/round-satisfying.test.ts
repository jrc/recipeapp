import { roundSatisfying } from "../src/round-satisfying";

function testRoundSatisfyingBasic(): void {
  let result = roundSatisfying(1.23, 0.05);
  console.assert(
    Math.abs(result - 1.25) < 1e-10,
    `1.23, tol 0.05 → 1.25 (factor 0.25): Expected 1.25, Got ${result}`,
  );

  result = roundSatisfying(3.11, 0.05);
  console.assert(
    Math.abs(result - 3) < 1e-10,
    `3.11, tol 0.05 → 3 (factor 1.0): Expected 3, Got ${result}`,
  );

  result = roundSatisfying(4.92, 0.05);
  console.assert(
    Math.abs(result - 5) < 1e-10,
    `4.92, tol 0.05 → 5 (factor 1.0): Expected 5, Got ${result}`,
  );

  result = roundSatisfying(998, 0.05);
  console.assert(
    Math.abs(result - 1000) < 1e-10,
    `998, tol 0.05 → 1000 (factor 1.0, integer): Expected 1000, Got ${result}`,
  );

  result = roundSatisfying(2 / 3, 0.05); // approx 0.66666667
  console.assert(
    Math.abs(result - 0.7) < 1e-10,
    `2/3 (approx 0.6667), tol 0.05 → 0.7 (factor 1.0): Expected 0.7, Got ${result}`,
  );

  result = roundSatisfying(1.23456, 0.1);
  console.assert(
    Math.abs(result - 1.3) < 1e-10,
    `1.23456, tol 0.1 → 1.3 (factor 0.25, JS rounding of 1.25): Expected 1.3, Got ${result}`,
  );

  result = roundSatisfying(96.111, 0.05);
  console.assert(
    Math.abs(result - 100) < 1e-10,
    `96.111, tol 0.05 → 100 (factor 1.0): Expected 100, Got ${result}`,
  );
}

function testRoundSatisfyingEdgeCases(): void {
  let result = roundSatisfying(0, 0.05);
  console.assert(
    Math.abs(result - 0) < 1e-10,
    `0, tol 0.05 → 0: Expected 0, Got ${result}`,
  );

  result = roundSatisfying(1, 0.05);
  console.assert(
    Math.abs(result - 1) < 1e-10,
    `1, tol 0.05 → 1 (factor 1.0): Expected 1, Got ${result}`,
  );

  result = roundSatisfying(0.5, 0.05);
  console.assert(
    Math.abs(result - 0.5) < 1e-10,
    `0.5, tol 0.05 → 0.5 (factor 1.0): Expected 0.5, Got ${result}`,
  );

  result = roundSatisfying(0.25, 0.05);
  console.assert(
    Math.abs(result - 0.25) < 1e-10,
    `0.25, tol 0.05 → 0.25 (factor 0.5): Expected 0.25, Got ${result}`,
  );
}

function testRoundSatisfyingDifferentTolerances(): void {
  let result = roundSatisfying(1.23, 0.1);
  console.assert(
    Math.abs(result - 1.3) < 1e-10, // 1.25 rounds to 1.3 with precision 1
    `1.23, tol 0.1 → 1.3 (factor 0.25, JS rounding of 1.25): Expected 1.3, Got ${result}`,
  );

  result = roundSatisfying(1.23, 0.01);
  console.assert(
    Math.abs(result - 1.23) < 1e-10,
    `1.23, tol 0.01 → 1.23 (fallback to input rounded): Expected 1.23, Got ${result}`,
  );
}

function testRoundSatisfyingMagnitude(): void {
  // Larger numbers
  let result = roundSatisfying(123.4, 0.05);
  console.assert(
    Math.abs(result - 125) < 1e-10,
    `123.4, tol 0.05 → 125 (factor 0.25): Expected 125, Got ${result}`,
  );

  result = roundSatisfying(9876, 0.05);
  console.assert(
    Math.abs(result - 10000) < 1e-10,
    `9876, tol 0.05 → 10000 (factor 1.0): Expected 10000, Got ${result}`,
  );

  // Small numbers
  result = roundSatisfying(0.123, 0.05);
  console.assert(
    Math.abs(result - 0.12) < 1e-10,
    `0.123, tol 0.05 → 0.12 (factor 0.1): Expected 0.12, Got ${result}`,
  );

  result = roundSatisfying(0.067, 0.05);
  console.assert(
    Math.abs(result - 0.07) < 1e-10,
    `0.067, tol 0.05 → 0.07 (factor 1.0): Expected 0.07, Got ${result}`,
  );
}

function testRoundSatisfyingErrorCases(): void {
  const errorTests = [
    { input: -1, tolerance: 0.05, description: "negative input" },
    { input: 5, tolerance: -0.1, description: "negative tolerance (<0)" },
    { input: 5, tolerance: 0.0, description: "zero tolerance (<=0)" },
    { input: 5, tolerance: 1.0, description: "tolerance === 1.0 (>=1)" },
    { input: 5, tolerance: 1.5, description: "tolerance > 1.0 (>=1)" },
  ];

  for (const test of errorTests) {
    try {
      roundSatisfying(test.input, test.tolerance);
      console.assert(
        false,
        `Error case "${test.description}": Should have thrown error but got a result for input=${test.input}, tolerance=${test.tolerance}`,
      );
    } catch (error: any) {
      console.assert(
        error instanceof Error,
        `Error case "${test.description}": Should throw an Error instance. Got: ${error}`,
      );
      // Check specific error messages if desired, e.g.:
      // if (test.description.includes("negative input")) {
      //   console.assert(error.message.includes("x must be >= 0.0"), `Wrong message for negative input: ${error.message}`);
      // } else if (test.description.includes("tolerance")) {
      //   console.assert(error.message.includes("tolerance must be > 0.0 and < 1.0"), `Wrong message for tolerance: ${error.message}`);
      // }
    }
  }
}

/**
 * Runs all tests for the roundSatisfying function.
 * Call this function from your main application entry point or a dedicated test runner.
 * For example, in an HTML file:
 * <script type="module">
 *   import { runRoundSatisfyingTests } from './tests/round-satisfying.test.js';
 *   runRoundSatisfyingTests();
 * </script>
 */
export function runRoundSatisfyingTests(): void {
  testRoundSatisfyingBasic();
  testRoundSatisfyingEdgeCases();
  testRoundSatisfyingDifferentTolerances();
  testRoundSatisfyingMagnitude();
  testRoundSatisfyingErrorCases();

  console.log("roundsatisfying tests completed.");
}
