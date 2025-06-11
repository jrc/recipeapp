import {
  parseFraction,
  createNumberPattern,
  normalizeNumbers,
} from "../src/parse-fraction";

function testParseFraction() {
  // Test basic decimal numbers
  console.assert(parseFraction("1") === 1.0, "Should parse integer 1");
  console.assert(parseFraction("1.5") === 1.5, "Should parse decimal 1.5");
  console.assert(parseFraction("0.25") === 0.25, "Should parse decimal 0.25");
  console.assert(
    parseFraction("10.75") === 10.75,
    "Should parse decimal 10.75",
  );

  // Test Unicode fractions
  console.assert(parseFraction("½") === 0.5, "Should parse ½");
  console.assert(parseFraction("¼") === 0.25, "Should parse ¼");
  console.assert(parseFraction("¾") === 0.75, "Should parse ¾");
  console.assert(
    Math.abs(parseFraction("⅓") - 1 / 3) < 0.0001,
    "Should parse ⅓",
  );
  console.assert(
    Math.abs(parseFraction("⅔") - 2 / 3) < 0.0001,
    "Should parse ⅔",
  );
  console.assert(parseFraction("⅛") === 0.125, "Should parse ⅛");

  // Test mixed Unicode fractions
  console.assert(parseFraction("1½") === 1.5, "Should parse 1½");
  console.assert(parseFraction("2¼") === 2.25, "Should parse 2¼");
  console.assert(parseFraction("3¾") === 3.75, "Should parse 3¾");
  console.assert(
    Math.abs(parseFraction("1⅓") - (1 + 1 / 3)) < 0.0001,
    "Should parse 1⅓",
  );
  // Test with spaces
  console.assert(parseFraction("1 ½") === 1.5, "Should parse '1 ½' with space");
  console.assert(
    parseFraction("2 ¼") === 2.25,
    "Should parse '2 ¼' with space",
  );

  // Test regular fractions
  console.assert(parseFraction("1/2") === 0.5, "Should parse 1/2");
  console.assert(parseFraction("1/4") === 0.25, "Should parse 1/4");
  console.assert(parseFraction("3/4") === 0.75, "Should parse 3/4");
  console.assert(
    Math.abs(parseFraction("1/3") - 1 / 3) < 0.0001,
    "Should parse 1/3",
  );
  console.assert(
    Math.abs(parseFraction("2/3") - 2 / 3) < 0.0001,
    "Should parse 2/3",
  );
  console.assert(parseFraction("1/8") === 0.125, "Should parse 1/8");

  // Test mixed fractions
  console.assert(parseFraction("1 1/2") === 1.5, "Should parse '1 1/2'");
  console.assert(parseFraction("2 1/4") === 2.25, "Should parse '2 1/4'");
  console.assert(parseFraction("3 3/4") === 3.75, "Should parse '3 3/4'");
  console.assert(
    Math.abs(parseFraction("1 1/3") - (1 + 1 / 3)) < 0.0001,
    "Should parse '1 1/3'",
  );

  // Test whitespace handling
  console.assert(
    parseFraction(" 1/2 ") === 0.5,
    "Should handle leading/trailing spaces",
  );
  console.assert(
    parseFraction(" 1 1/2 ") === 1.5,
    "Should handle spaces in mixed fractions",
  );
  console.assert(
    parseFraction(" ½ ") === 0.5,
    "Should handle spaces around Unicode fractions",
  );
  console.assert(
    parseFraction(" 1 ½ ") === 1.5,
    "Should handle spaces in mixed Unicode fractions",
  );
  console.assert(
    parseFraction("1    1/2") === 1.5,
    "Should handle multiple spaces",
  );

  // Test precision with repeating decimals
  const oneThird = parseFraction("1/3");
  console.assert(
    Math.abs(oneThird - 0.3333333333) < 0.0001,
    "Should handle 1/3 precision",
  );

  const twoThirds = parseFraction("2/3");
  console.assert(
    Math.abs(twoThirds - 0.6666666667) < 0.0001,
    "Should handle 2/3 precision",
  );

  // Test large numbers
  const largeResult = parseFraction("12345678/87654321");
  console.assert(
    typeof largeResult === "number",
    "Should handle large fractions",
  );
  console.assert(
    Math.abs(largeResult - 0.14084505885340207) < 0.0001,
    "Should calculate large fractions correctly",
  );
}

function testParseFractionErrorCases() {
  const errorCases = [
    "",
    "   ",
    "abc",
    "1/0",
    "2 1/0",
    "/",
    "1/",
    "/2",
    "½½",
    "1½½",
    "1.5.5",
    "alpha1/2beta",
  ];

  for (const testCase of errorCases) {
    try {
      parseFraction(testCase);
      console.assert(false, `Should throw error for: "${testCase}"`);
    } catch (error) {
      // Expected behavior
      console.assert(
        error instanceof Error,
        `Should throw Error for: "${testCase}"`,
      );
    }
  }
}

function testCreateNumberPattern() {
  const pattern = createNumberPattern();

  // Test valid cases
  const validCases = [
    "1",
    "1.0",
    "1.5",
    "10.75",
    "0.25",
    "½",
    "¼",
    "¾",
    "⅓",
    "⅔",
    "⅛",
    "1½",
    "2¼",
    "3¾",
    "1⅓",
    "1 ½",
    "2 ¼",
    "1/2",
    "1/4",
    "3/4",
    "1/3",
    "2/3",
    "1/8",
    "1 1/2",
    "2 1/4",
    "3 3/4",
    "1 1/3",
  ];

  for (const testCase of validCases) {
    const matches = testCase.match(new RegExp(`^${pattern.source}$`));
    console.assert(matches !== null, `Pattern should match: "${testCase}"`);
  }

  // Test invalid cases that should not match the full pattern
  const invalidCases = [
    "",
    "abc",
    "1/",
    "/2",
    ".5",
    "½½",
    "1½½",
    "1.5.5",
    "alpha1/2beta",
  ];

  for (const testCase of invalidCases) {
    const matches = testCase.match(new RegExp(`^${pattern.source}$`));
    console.assert(matches === null, `Pattern should not match: "${testCase}"`);
  }
}

function testPatternInContext() {
  const pattern = createNumberPattern();

  const testCases = [
    {
      text: "Mix 1½ cups with 2 1/4 tsp and 3.5 ml",
      expected: ["1½", "2 1/4", "3.5"],
    },
    {
      text: "This is a ½ and this is 2/3. Also, 1 ½ and 1 1/4 and 1½!",
      expected: ["½", "2/3", "1 ½", "1 1/4", "1½"],
    },
    {
      text: "Mix 1 1/2 cups\nAdd 2¼ tsp\nUse ½ oz",
      expected: ["1 1/2", "2¼", "½"],
    },
  ];

  for (const { text, expected } of testCases) {
    const matches = Array.from(text.matchAll(pattern));
    const results = matches.map((match) => match[0].trim());

    console.assert(
      JSON.stringify(results) === JSON.stringify(expected),
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(results)} for: "${text}"`,
    );
  }
}

function testNormalizeNumbers() {
  // Test basic normalization
  let result = normalizeNumbers("Mix 1½ cups");
  console.assert(result === "Mix 1.5 cups", "Should normalize 1½ to 1.5");

  result = normalizeNumbers("Add 2 1/4 tsp");
  console.assert(result === "Add 2.25 tsp", "Should normalize 2 1/4 to 2.25");

  result = normalizeNumbers("Use ¾ oz");
  console.assert(result === "Use 0.75 oz", "Should normalize ¾ to 0.75");

  result = normalizeNumbers("Mix 1½ cups with 2 1/4 tsp and 3.5 ml");
  console.assert(
    result === "Mix 1.5 cups with 2.25 tsp and 3.5 ml",
    "Should normalize multiple numbers",
  );

  // Test that integers don't get unnecessary decimals
  result = normalizeNumbers("Add 2 cups");
  console.assert(result === "Add 2 cups", "Should keep integers as integers");

  // Test that invalid patterns are left unchanged
  result = normalizeNumbers("Add some flour");
  console.assert(
    result === "Add some flour",
    "Should leave non-numbers unchanged",
  );
}

export function runParseFractionTests() {
  testParseFraction();
  testParseFractionErrorCases();
  testCreateNumberPattern();
  testPatternInContext();
  testNormalizeNumbers();

  console.log("parse-fraction tests completed.");
}
