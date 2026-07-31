import { describe, expect, it } from "vitest";
import { formatAmount } from "./format";

describe("formatAmount", () => {
  it("formats USD amounts", () => {
    expect(formatAmount(90, "USD")).toBe("$90.00");
    expect(formatAmount("45.5", "USD")).toBe("$45.50");
  });

  it("formats KSH amounts", () => {
    expect(formatAmount(90, "KSH")).toBe("KSh 90.00");
    expect(formatAmount("45.5", "KSH")).toBe("KSh 45.50");
  });

  it("defaults to USD when currency is missing", () => {
    expect(formatAmount(10, undefined)).toBe("$10.00");
  });
});
