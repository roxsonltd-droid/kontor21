import { expect } from "chai";
import {
  parseDecimalString,
  parsePositiveDecimalString,
} from "../lib/money.ts";

describe("money decimal-string parsing", function () {
  it("accepts integer and fractional decimal strings", function () {
    expect(parseDecimalString("12", "x")).to.equal("12");
    expect(parseDecimalString("12.5", "x")).to.equal("12.5");
    expect(parseDecimalString("0.000001", "x")).to.equal("0.000001");
  });

  it("rejects empty, malformed, negative, and non-numeric input", function () {
    for (const bad of ["", "abc", "1.2.3", "-1", "1e3", ".5", "5.", " 1", "1 "]) {
      expect(() => parseDecimalString(bad, "x")).to.throw("decimal string");
    }
  });

  it("rejects non-finite numbers", function () {
    expect(() => parseDecimalString(NaN, "x")).to.throw();
    expect(() => parseDecimalString(Infinity, "x")).to.throw();
  });

  it("rejects zero and negative through the positive validator", function () {
    expect(() => parsePositiveDecimalString("0", "priceUsdc")).to.throw("greater than zero");
    expect(() => parsePositiveDecimalString("0.000000", "priceUsdc")).to.throw("greater than zero");
    expect(() => parsePositiveDecimalString("-2", "priceUsdc")).to.throw("decimal string");
  });
});
