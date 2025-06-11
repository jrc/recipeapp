import { roundSatisfying } from "../src/round-satisfying";

function testRoundSatisfyingBasic(): void {
  // Basic examples - corrected to match actual Python behavior
  let result = roundSatisfying(1.23, 0.05);
  console.assert(
    Math.abs(result - 1.25) < 1e-10, // Account for floating point precision
    `1.23 → 1.25 (factor 0.25): Expected 1.25, Got ${result}`,
  );

  result = roundSatisfying(3.11, 0.05);
  console.assert(
    Math.abs(result - 3.1) < 1e-10,
    `3.11 → 3.1 (factor 0.1): Expected 3.1, Got ${result}`,
  );

  result = roundSatisfying(4.92, 0.05);
  console.assert(
    Math.abs(result - 4.9) < 1e-10,
    `4.92 → 4.9 (factor 0.1): Expected 4.9, Got ${result}`,
  );

  result = roundSatisfying(998, 0.05);
  console.assert(
    Math.abs(result - 1000) < 1e-10,
    `998 → 1000 (factor 1.0, integer): Expected 1000, Got ${result}`,
  );

  result = roundSatisfying(2 / 3, 0.05);
  console.assert(
    Math.abs(result - 0.67) < 1e-10,
    `2/3 → 0.67 (factor 0.05): Expected 0.67, Got ${result}`,
  );

  result = roundSatisfying(1.23456, 0.1);
  console.assert(
    Math.abs(result - 1.2) < 1e-10,
    `1.23456 with tolerance 0.1 → 1.2: Expected 1.2, Got ${result}`,
  );
}

function testRoundSatisfyingEdgeCases(): void {
  let result = roundSatisfying(0, 0.05);
  console.assert(
    Math.abs(result - 0) < 1e-10,
    `zero stays zero: Expected 0, Got ${result}`,
  );

  result = roundSatisfying(1, 0.05);
  console.assert(
    Math.abs(result - 1) < 1e-10,
    `exact integer: Expected 1, Got ${result}`,
  );

  result = roundSatisfying(0.5, 0.05);
  console.assert(
    Math.abs(result - 0.5) < 1e-10,
    `exact half: Expected 0.5, Got ${result}`,
  );

  result = roundSatisfying(0.25, 0.05);
  console.assert(
    Math.abs(result - 0.25) < 1e-10,
    `exact quarter: Expected 0.25, Got ${result}`,
  );
}

function testRoundSatisfyingDifferentTolerances(): void {
  let result = roundSatisfying(1.23, 0.1);
  console.assert(
    Math.abs(result - 1.2) < 1e-10,
    `1.23 with 10% tolerance: Expected 1.2, Got ${result}`,
  );

  result = roundSatisfying(1.23, 0.01);
  console.assert(
    Math.abs(result - 1.23) < 1e-10,
    `1.23 with 1% tolerance (no change): Expected 1.23, Got ${result}`,
  );
}

function testRoundSatisfyingMagnitude(): void {
  // Larger numbers
  let result = roundSatisfying(123.4, 0.05);
  console.assert(
    Math.abs(result - 125) < 1e-10,
    `123.4 → 125: Expected 125, Got ${result}`,
  );

  result = roundSatisfying(9876, 0.05);
  console.assert(
    Math.abs(result - 9900) < 1e-10,
    `9876 → 9900: Expected 9900, Got ${result}`,
  );

  // Small numbers
  result = roundSatisfying(0.123, 0.05);
  console.assert(
    Math.abs(result - 0.12) < 1e-10,
    `0.123 → 0.12: Expected 0.12, Got ${result}`,
  );

  result = roundSatisfying(0.067, 0.05);
  console.assert(
    Math.abs(result - 0.07) < 1e-10,
    `0.067 → 0.07: Expected 0.07, Got ${result}`,
  );
}

function testRoundSatisfyingErrorCases(): void {
  const errorTests = [
    { input: -1, tolerance: 0.05, description: "negative input" },
    { input: 5, tolerance: -0.1, description: "negative tolerance" },
    { input: 5, tolerance: 1.0, description: "tolerance >= 1.0" },
    { input: 5, tolerance: 1.5, description: "tolerance > 1.0" },
  ];

  for (const test of errorTests) {
    try {
      roundSatisfying(test.input, test.tolerance);
      console.assert(
        false,
        `${test.description}: Should have thrown error but got a result`,
      );
    } catch (error: any) {
      console.assert(
        error instanceof Error,
        `${test.description}: Should throw an Error`,
      );
      // Optionally check specific error message content if needed
      // console.assert(error.message.includes("expected a tolerance..."), `${test.description}: Error message mismatch`);
    }
  }
}

/**
 * Runs all tests for the roundSatisfying function.
 */
export function runRoundSatisfyingTests(): void {
  testRoundSatisfyingBasic();
  testRoundSatisfyingEdgeCases();
  testRoundSatisfyingDifferentTolerances();
  testRoundSatisfyingMagnitude();
  testRoundSatisfyingErrorCases();

  console.log("roundsatisfying tests completed.");
}
