import { runParseFractionTests } from "../tests/parse-fraction.test";
import { runParseIngredientTests } from "../tests/parse-ingredient.test";
import { runParseQuantityTests } from "../tests/parse-quantity.test";

// Run tests
runParseFractionTests();
runParseIngredientTests();
runParseQuantityTests();

console.log("All tests completed!");
