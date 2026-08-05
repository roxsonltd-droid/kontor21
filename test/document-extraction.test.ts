import { expect } from "chai";
import {
  extractFieldValue,
  extractAllFields,
  normalizeExtractedValue,
  extractionMetaFor,
} from "../lib/document-extraction.ts";

describe("document extraction", function () {
  describe("normalizeExtractedValue", function () {
    it("converts comma decimals to dots", function () {
      expect(normalizeExtractedValue("4,8")).to.equal("4.8");
    });

    it("strips thousands separators", function () {
      expect(normalizeExtractedValue("50 000")).to.equal("50000");
      expect(normalizeExtractedValue("50,000")).to.equal("50000");
    });

    it("leaves integers and already-normal decimals untouched", function () {
      expect(normalizeExtractedValue("8.0")).to.equal("8.0");
      expect(normalizeExtractedValue("123")).to.equal("123");
    });

    it("returns the trimmed raw value for non-numeric input", function () {
      expect(normalizeExtractedValue("Hamad Port")).to.equal("Hamad Port");
    });
  });

  describe("extractFieldValue", function () {
    it("extracts a numeric value with unit from OCR text", function () {
      const result = extractFieldValue("Moisture: 8.0 %\nNet weight 50 tons", "moisture");
      expect(result).to.deep.include({ parameter: "moisture", value: "8.0", unit: "%" });
    });

    it("extracts a value after a dash separator", function () {
      const result = extractFieldValue("moisture - 4.8 %", "moisture");
      expect(result?.value).to.equal("4.8");
      expect(result?.unit).to.equal("%");
    });

    it("is case-insensitive", function () {
      const result = extractFieldValue("MOISTURE CONTENT: 12.5%", "moisture content");
      expect(result?.value).to.equal("12.5");
    });

    it("falls back to free text when no number follows", function () {
      const result = extractFieldValue("Loading port: Hamad Port", "loading port");
      expect(result?.value).to.equal("Hamad Port");
    });

    it("does not match a parameter as a substring of another word", function () {
      const result = extractFieldValue("says moistureX is not a parameter", "moisture");
      expect(result).to.equal(null);
    });

    it("returns null when the parameter is absent", function () {
      expect(extractFieldValue("Weight: 10 tons", "moisture")).to.equal(null);
    });

    it("returns null for empty input", function () {
      expect(extractFieldValue("", "moisture")).to.equal(null);
      expect(extractFieldValue("Weight: 10", "")).to.equal(null);
    });
  });

  describe("extractAllFields", function () {
    it("extracts each requested parameter once", function () {
      const text = "Moisture: 8.0 %\nMoisture again: 9.0 %\nWeight: 50 tons";
      const result = extractAllFields(text, ["moisture", "weight"]);
      expect(result).to.have.length(2);
      expect(result![0]).to.deep.include({ parameter: "moisture", value: "8.0" });
      expect(result![1]).to.deep.include({ parameter: "weight", value: "50" });
    });

    it("skips parameters that are not present", function () {
      const result = extractAllFields("Weight: 50 tons", ["moisture", "weight"]);
      expect(result).to.have.length(1);
      expect(result![0].parameter).to.equal("weight");
    });

    it("deduplicates repeated parameters in the request list", function () {
      const result = extractAllFields("Weight: 50 tons", ["weight", "weight"]);
      expect(result).to.have.length(1);
    });
  });

  describe("extractionMetaFor", function () {
    it("marks a manual value as MANUAL", function () {
      expect(extractionMetaFor("moisture", "4.8", "moisture: 4.8 %")).to.deep.include({
        method: "MANUAL",
        parameter: "moisture",
      });
    });

    it("marks an OCR-derived value as OCR_AUTO", function () {
      expect(extractionMetaFor("moisture", undefined, "moisture: 4.8 %")).to.deep.include({
        method: "OCR_AUTO",
        parameter: "moisture",
      });
    });

    it("trims and omits empty matched text", function () {
      expect(extractionMetaFor("moisture", undefined, "   ")).to.deep.include({
        method: "OCR_AUTO",
        parameter: "moisture",
      });
      expect(extractionMetaFor("moisture", undefined, "   ").matchedText).to.equal(undefined);
    });
  });
});
