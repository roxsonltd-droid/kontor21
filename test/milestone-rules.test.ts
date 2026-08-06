import { expect } from "chai";
import {
  buildRulesSnapshot,
  nextRulesVersion,
  normalizeRuleSet,
  conditionOperatorFor,
} from "../lib/milestone-rules.ts";

describe("versioned milestone rules policies", function () {
  const validRules = [
    { parameter: "moisture", operator: "<=", value: "8.0", unit: "%", providerRole: "LAB", isRequired: true },
    { parameter: "weight", operator: ">=", value: "50", unit: "tons", providerRole: "INSPECTOR", isRequired: true },
  ];

  it("normalizes a valid rule set with canonical operators and trimmed fields", function () {
    const result = normalizeRuleSet(validRules);
    expect(result).to.be.an("array");
    expect(result).to.have.length(2);
    expect(result![0]).to.deep.include({ parameter: "moisture", operator: "LTE", value: "8.0", unit: "%", providerRole: "LAB", isRequired: true });
    expect(result![1]).to.deep.include({ parameter: "weight", operator: "GTE", value: "50", unit: "tons", providerRole: "INSPECTOR" });
  });

  it("defaults isRequired to true when omitted", function () {
    const result = normalizeRuleSet([{ parameter: "location", operator: "==", value: "Varna", providerRole: "CARRIER" }]);
    expect(result![0].isRequired).to.equal(true);
  });

  it("rejects malformed rules (missing parameter, operator, value, or role)", function () {
    const cases = [
      [{ operator: "<=", value: "8.0", providerRole: "LAB" }],
      [{ parameter: "moisture", value: "8.0", providerRole: "LAB" }],
      [{ parameter: "moisture", operator: "=", value: "8.0", providerRole: "LAB" }],
      [{ parameter: "moisture", operator: "<=", value: "8.0" }],
      [{ parameter: "moisture", operator: "<=", value: "8.0", providerRole: "NOT_A_ROLE" }],
      [{ parameter: "  ", operator: "<=", value: "8.0", providerRole: "LAB" }],
    ];
    for (const rules of cases) {
      expect(normalizeRuleSet(rules as never), JSON.stringify(rules)).to.equal(null);
    }
  });

  it("rejects non-array input", function () {
    expect(normalizeRuleSet(undefined as never)).to.equal(null);
    expect(normalizeRuleSet("x" as never)).to.equal(null);
  });

  it("builds an immutable snapshot payload from normalized rules", function () {
    const snapshot = buildRulesSnapshot(normalizeRuleSet(validRules)!);
    expect(snapshot.conditions).to.have.length(2);
    expect(snapshot.conditions[0]).to.deep.equal({
      parameter: "moisture",
      operator: "LTE",
      value: "8.0",
      unit: "%",
      providerRole: "LAB",
      isRequired: true,
    });
    expect(JSON.parse(JSON.stringify(snapshot))).to.deep.equal(snapshot);
  });

  it("maps operators to canonical ConditionOperator values", function () {
    expect(conditionOperatorFor("<=")).to.equal("LTE");
    expect(conditionOperatorFor(">=")).to.equal("GTE");
    expect(conditionOperatorFor("<")).to.equal("LT");
    expect(conditionOperatorFor(">")).to.equal("GT");
    expect(conditionOperatorFor("==")).to.equal("EQ");
    expect(conditionOperatorFor("!=")).to.equal(null);
  });

  it("increments rules versions safely", function () {
    expect(nextRulesVersion(1)).to.equal(2);
    expect(nextRulesVersion(4)).to.equal(5);
    expect(nextRulesVersion(NaN)).to.equal(1);
  });

  it("trims whitespace around rule fields", function () {
    const result = normalizeRuleSet([{ parameter: "  moisture ", operator: " <=", value: " 8.0 ", unit: " % ", providerRole: " LAB " }]);
    expect(result).to.equal(null);
    const clean = normalizeRuleSet([{ parameter: "  moisture ", operator: "<=", value: " 8.0 ", unit: " % ", providerRole: "LAB" }]);
    expect(clean![0]).to.deep.include({ parameter: "moisture", value: "8.0", unit: "%" });
  });
});
