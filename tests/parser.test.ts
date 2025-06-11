import { runParseDurationTests } from "../tests/parse-duration.test";
import { runParseFractionTests } from "../tests/parse-fraction.test";
import { runParseIngredientTests } from "../tests/parse-ingredient.test";
import { runParseQuantityTests } from "../tests/parse-quantity.test";

// Run tests
runParseDurationTests();
runParseFractionTests();
runParseIngredientTests();
runParseQuantityTests();

console.log("All tests completed!");
