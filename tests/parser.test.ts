import { runParseIngredientTests } from "../tests/parse-ingredient.test";
import { runParseQuantityTests } from "../tests/parse-quantity.test";

// Run tests
runParseIngredientTests();
runParseQuantityTests();

console.log("All tests completed!");
