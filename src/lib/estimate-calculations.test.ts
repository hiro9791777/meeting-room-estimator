import { describe, expect, it } from "vitest";

import { calculateEstimate, calculateItemFee } from "./estimate-calculations";

describe("calculateItemFee", () => {
  it("returns zero when nothing is selected", () => {
    expect(calculateItemFee([])).toBe(0);
  });

  it("adds the unit price multiplied by quantity", () => {
    expect(
      calculateItemFee([
        { id: 1, unitPrice: 2_200, quantity: 2 },
        { id: 2, unitPrice: 800, quantity: 3 },
      ]),
    ).toBe(6_800);
  });
});

describe("calculateEstimate", () => {
  it("calculates each category and the grand total", () => {
    expect(
      calculateEstimate(
        3_200,
        2,
        [{ id: 1, unitPrice: 2_200, quantity: 1 }],
        [{ id: 1, unitPrice: 150, quantity: 4 }],
      ),
    ).toEqual({
      roomFee: 6_400,
      equipmentFee: 2_200,
      drinkFee: 600,
      totalAmount: 9_200,
    });
  });
});
