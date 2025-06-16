/**
 * Round numbers to "aesthetically pleasing" values within tolerance.
 *
 * Algorithm: Iterate through preferred factors [1.0, 0.5, 0.25, 0.1, 0.05]
 * multiplied by the appropriate power of 10. For the first factor that
 * yields valid candidates within the tolerance bounds, return the candidate
 * closest to the input. If no factor yields a satisfying candidate, return
 * the original number rounded to the precision derived from the tolerance.
 *
 * This version aligns with the Python implementation's factor prioritization.
 *
 * Examples:
 * - 1.23 (tol 0.05) → 1.25 (factor 0.25, precision 2)
 * - 3.11 (tol 0.05) → 3 (factor 1.0, precision 2)
 * - 96.111 (tol 0.05) → 100 (factor 1.0, precision 2)
 * - 2/3 (0.666...) (tol 0.05) → 0.7 (factor 1.0, precision 2)
 *   Note: Python code also yields 0.7. The example `0.67` in Python docstring might assume a different factor priority.
 * - 1.23456 (tol 0.1) → 1.3 (factor 0.25, precision 1)
 *   Note: Python (using round-half-to-even) yields 1.2. JS toFixed (round-half-up) yields 1.3 for 1.25.
 */
export function roundSatisfying(x: number, tolerance: number = 0.05): number {
  if (x < 0.0) {
    throw new Error("x must be >= 0.0");
  }
  if (tolerance <= 0.0 || tolerance >= 1.0) {
    // Python has 0.0 <= tolerance < 1.0. Adjusted to match.
    throw new Error("tolerance must be > 0.0 and < 1.0");
  }

  if (x === 0.0) {
    return 0;
  }

  // Determine precision from tolerance (e.g., tol=0.05 -> prec=2; tol=0.1 -> prec=1)
  const precision = -Math.floor(Math.log10(tolerance));

  const lowerBound = x * (1 - tolerance);
  const upperBound = x * (1 + tolerance);

  // Get the reference power of 10 for x (e.g., x=96 -> power=1; x=123 -> power=2; x=0.12 -> power=-1)
  const power = Math.floor(Math.log10(x));

  const factors = [1.0, 0.5, 0.25, 0.1, 0.05];

  for (const factor of factors) {
    const currentFactorCandidates: number[] = [];
    // Calculate step for this factor and power
    // e.g., factor=1.0, power=1 (for x=96) -> step = 1.0 * 10^1 = 10
    // e.g., factor=0.1, power=0 (for x=3.11) -> step = 0.1 * 10^0 = 0.1
    const step = factor * Math.pow(10, power);

    if (step === 0) continue; // Avoid division by zero if step becomes extremely small

    // Determine range of multipliers for the current step
    const startMultiplier = Math.floor(lowerBound / step);
    const endMultiplier = Math.ceil(upperBound / step);

    for (let i = startMultiplier; i <= endMultiplier; i++) {
      const candidateValue = i * step;
      // Round candidate to the calculated precision
      // parseFloat(value.toFixed(precision)) handles rounding (typically half up)
      const candidate = parseFloat(candidateValue.toFixed(precision));

      if (lowerBound <= candidate && candidate <= upperBound) {
        // Only add unique candidates for this factor to avoid redundant checks, though min logic would handle it.
        if (!currentFactorCandidates.includes(candidate)) {
          currentFactorCandidates.push(candidate);
        }
      }
    }

    if (currentFactorCandidates.length > 0) {
      // If candidates were found for this factor, choose the one closest to x
      const bestCandidate = currentFactorCandidates.reduce(
        (closest, current) =>
          Math.abs(current - x) < Math.abs(closest - x) ? current : closest,
      );
      // Return as integer if it's a whole number, otherwise as float (number in JS)
      return Number.isInteger(bestCandidate)
        ? Math.round(bestCandidate)
        : bestCandidate;
    }
  }

  // If no satisfying candidate found across all factors, return x rounded to precision
  return parseFloat(x.toFixed(precision));
}
