/**
 * Round the input number `x` to "aesthetically pleasing" values within a given
 * tolerance (default 5%) by
 *
 * 1. Working through progressively more precise factors (1.0, 0.5, 0.25, 0.1,
 *    0.05) of the nearest power of 10
 * 2. Testing multiples of each factor to find valid candidates
 * 3. Choosing the candidate closest to the input value that's within tolerance
 *
 * Key rules:
 *
 * - Must stay within x * (1 ± tolerance) of input
 * - Returns integer if the chosen value is a whole number, float otherwise
 * - If no satisfying value is found, returns the original number
 * - Result precision (decimal places) matches that of the tolerance value
 *   (e.g. tolerance=0.05 → 2 decimal places, 0.1 → 1 decimal place)
 *
 * Examples:
 *
 * - 1.23 → 1.25 (used factor 0.25)
 * - 3.11 → 3.1 (used factor 0.1)
 * - 4.92 → 4.9 (used factor 0.1)
 * - 998 → 1000 (used factor 1.0, returns int)
 * - 2/3 with tolerance 0.05 → 0.67 (2 decimal places)
 * - 1.23456 with tolerance 0.1 → 1.2 (1 decimal place)
 *
 * @param x - The input number to round
 * @param tolerance - The tolerance for rounding (default 0.05)
 * @returns Rounded number, returned as integer if whole number, float otherwise
 */
export function roundSatisfying(x: number, tolerance: number = 0.05): number {
    if (x == null) {
        throw new Error('x cannot be null or undefined');
    }
    if (x < 0.0) {
        throw new Error('x must be >= 0.0');
    }
    if (tolerance < 0.0 || tolerance >= 1.0) {
        throw new Error('tolerance must be between 0.0 and 1.0 (exclusive)');
    }

    if (x === 0.0) {
        return 0;
    }

    // Determine precision from tolerance
    const precision = -Math.floor(Math.log10(tolerance));

    // Calculate bounds
    const lowerBound = x * (1 - tolerance);
    const upperBound = x * (1 + tolerance);

    // Get the reference power of 10
    const power = Math.floor(Math.log10(x));

    // Common factors to try (in order of preference)
    const factors = [1.0, 0.5, 0.25, 0.1, 0.05];

    // Collect all valid candidates from all factors
    const allCandidates: number[] = [];

    for (const factor of factors) {
        const step = factor * Math.pow(10, power);

        // Find the range of multipliers to try
        const start = Math.floor(lowerBound / step);
        const end = Math.ceil(upperBound / step);

        // Check each possible multiple
        for (let i = start; i <= end; i++) {
            const candidate = parseFloat((i * step).toFixed(precision));
            if (lowerBound <= candidate && candidate <= upperBound) {
                // Avoid duplicates
                if (!allCandidates.includes(candidate)) {
                    allCandidates.push(candidate);
                }
            }
        }
    }

    // If we found candidates, choose the closest one
    if (allCandidates.length > 0) {
        const best = allCandidates.reduce((closest, current) =>
            Math.abs(current - x) < Math.abs(closest - x) ? current : closest
        );

        // Return as integer if it's a whole number
        if (Number.isInteger(best)) {
            return Math.round(best);
        }
        return best;
    }

    // If no satisfying value is found, return the original number rounded to precision
    return parseFloat(x.toFixed(precision));
}