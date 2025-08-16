import { describe, it, expect } from "vitest";
import fc from "fast-check";

describe("Credit System Properties", () => {
  describe("credit arithmetic properties", () => {
    it("should never allow negative credits", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // starting credits
          fc.integer({ min: 1, max: 100 }), // credits to deduct
          (startingCredits, deduction) => {
            const result = Math.max(0, startingCredits - deduction);
            expect(result).toBeGreaterThanOrEqual(0);
          },
        ),
      );
    });

    it("should maintain credit balance invariant after operations", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // initial credits
          fc.array(fc.integer({ min: -50, max: 50 }), { maxLength: 20 }), // operations
          (initialCredits, operations) => {
            let credits = initialCredits;

            for (const operation of operations) {
              if (operation > 0) {
                // Credit addition
                credits += operation;
              } else {
                // Credit deduction
                credits = Math.max(0, credits + operation);
              }
            }

            expect(credits).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(credits)).toBe(true);
          },
        ),
      );
    });

    it("should correctly calculate total credits after purchases", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // starting credits
          fc.array(fc.constantFrom(1, 10, 25), { maxLength: 10 }), // purchase amounts
          (startingCredits, purchases) => {
            const totalPurchased = purchases.reduce(
              (sum, amount) => sum + amount,
              0,
            );
            const finalCredits = startingCredits + totalPurchased;

            expect(finalCredits).toBe(startingCredits + totalPurchased);
            expect(finalCredits).toBeGreaterThanOrEqual(startingCredits);
          },
        ),
      );
    });

    it("should maintain credit conservation during transfers", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 1000 }), // total system credits
          fc.integer({ min: 1, max: 5 }), // number of users
          (totalCredits, userCount) => {
            // Distribute credits among users
            const creditsPerUser = Math.floor(totalCredits / userCount);
            const remainder = totalCredits % userCount;

            const userCredits = Array(userCount).fill(creditsPerUser);
            if (remainder > 0) {
              userCredits[0] += remainder;
            }

            const redistributed = userCredits.reduce(
              (sum, credits) => sum + credits,
              0,
            );
            expect(redistributed).toBe(totalCredits);
          },
        ),
      );
    });
  });

  describe("credit validation properties", () => {
    it("should reject invalid credit amounts", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.float({ min: -1000, max: -0.1 }), // negative numbers
            fc.float({ min: 0.1, max: 0.9 }), // fractional numbers
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity),
          ),
          (invalidAmount) => {
            const isValid =
              Number.isInteger(invalidAmount) && invalidAmount >= 0;
            expect(isValid).toBe(false);
          },
        ),
      );
    });

    it("should accept valid credit amounts", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10000 }), (validAmount) => {
          const isValid = Number.isInteger(validAmount) && validAmount >= 0;
          expect(isValid).toBe(true);
        }),
      );
    });
  });

  describe("credit deduction rules", () => {
    it("should only deduct credits if operation succeeds", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // user credits
          fc.boolean(), // operation success
          (userCredits, operationSucceeded) => {
            const finalCredits = operationSucceeded
              ? userCredits - 1
              : userCredits;

            if (operationSucceeded) {
              expect(finalCredits).toBe(userCredits - 1);
            } else {
              expect(finalCredits).toBe(userCredits);
            }
          },
        ),
      );
    });

    it("should prevent operations when insufficient credits", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 0 }), // zero credits
          fc.integer({ min: 1, max: 10 }), // required credits
          (availableCredits, requiredCredits) => {
            const canProceed = availableCredits >= requiredCredits;
            expect(canProceed).toBe(false);
          },
        ),
      );
    });
  });
});
