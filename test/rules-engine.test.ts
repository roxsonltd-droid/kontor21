import { expect } from "chai";
import { evaluateCondition } from "../lib/rules-engine.ts";
import { ConditionOperator } from "@prisma/client";

describe("Rules Engine", () => {
  describe("Numeric evaluation", () => {
    it("should evaluate LTE correctly", () => {
      expect(evaluateCondition("8.0", "8.5", "LTE")).to.be.true;
      expect(evaluateCondition("8.5", "8.5", "LTE")).to.be.true;
      expect(evaluateCondition("9.0", "8.5", "LTE")).to.be.false;
    });

    it("should evaluate GTE correctly", () => {
      expect(evaluateCondition("40.5", "40", "GTE")).to.be.true;
      expect(evaluateCondition("40.0", "40", "GTE")).to.be.true;
      expect(evaluateCondition("39.9", "40", "GTE")).to.be.false;
    });

    it("should handle commas as decimal separators", () => {
      expect(evaluateCondition("8,5", "8.5", "EQ")).to.be.true;
      expect(evaluateCondition("1.234,56", "1234.56", "EQ")).to.be.true;
      expect(evaluateCondition("1,234.56", "1234.56", "EQ")).to.be.true;
    });
    
    it("should strip whitespace", () => {
      expect(evaluateCondition(" 8.5 ", "8.5", "EQ")).to.be.true;
    });

    it("should return false for invalid numbers compared as math", () => {
      expect(evaluateCondition("abc", "8.5", "LTE")).to.be.false;
    });
  });

  describe("String evaluation", () => {
    it("should evaluate EQ case-insensitively", () => {
      expect(evaluateCondition("Hamad Port", "HAMAD PORT", "EQ")).to.be.true;
      expect(evaluateCondition("  Hamad Port  ", "Hamad Port", "EQ")).to.be.true;
    });

    it("should return false for EQ mismatch", () => {
      expect(evaluateCondition("Jebel Ali", "Hamad Port", "EQ")).to.be.false;
    });

    it("should return false for non-EQ string comparisons", () => {
      expect(evaluateCondition("Hamad Port", "Hamad Port", "LTE")).to.be.false;
    });
  });

  describe("Null/empty handling", () => {
    it("should return false if verifiedValue is null or undefined", () => {
      expect(evaluateCondition(null, "8.5", "LTE")).to.be.false;
      expect(evaluateCondition(undefined, "8.5", "LTE")).to.be.false;
    });

    it("should return false if verifiedValue is empty string", () => {
      expect(evaluateCondition("", "8.5", "LTE")).to.be.false;
    });
  });
});
