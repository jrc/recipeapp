/**
 * Round numbers to "aesthetically pleasing" values within tolerance.
 *
 * Algorithm: Generate candidates using factors [1.0, 0.5, 0.25, 0.1, 0.05]
 * multiplied by the appropriate power of 10, then return the closest candidate
 * to the input that falls within the tolerance bounds.
 *
 * Why this approach: Simply using the first valid factor produces wrong results.
 * For example, 3.11 with 5% tolerance could round to 3 (factor 1.0) or 3.1
 * (factor 0.1). Since 3.1 is closer to 3.11, we must evaluate all factors.
 *
 * Examples: 1.23 → 1.25, 3.11 → 3.1, 998 → 1000, 2/3 → 0.67
 */
export function roundSatisfying(x: number, tolerance: number = 0.05): number {
  if (x == null) {
    throw new Error("x cannot be null or undefined");
  }
  if (x < 0.0) {
    throw new Error("x must be >= 0.0");
  }
  if (tolerance < 0.0 || tolerance >= 1.0) {
    throw new Error("tolerance must be between 0.0 and 1.0 (exclusive)");
  }

  if (x === 0.0) {
    return 0;
  }

  const precision = -Math.floor(Math.log10(tolerance));
  const lowerBound = x * (1 - tolerance);
  const upperBound = x * (1 + tolerance);
  const power = Math.floor(Math.log10(x));
  const factors = [1.0, 0.5, 0.25, 0.1, 0.05];
  const allCandidates: number[] = [];

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
    const best = allCandidates.reduce((closest, current) =>
      Math.abs(current - x) < Math.abs(closest - x) ? current : closest,
    );
    return Number.isInteger(best) ? Math.round(best) : best;
  }

  return parseFloat(x.toFixed(precision));
}
