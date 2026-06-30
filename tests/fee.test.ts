import { stroopsToXlm } from "@/lib/invocation";

describe("stroopsToXlm", () => {
  it("converts one XLM (10000000 stroops) correctly", () => {
    expect(stroopsToXlm("10000000")).toBe("1.0000000");
  });

  it("converts a fractional amount correctly", () => {
    expect(stroopsToXlm("1234567")).toBe("0.1234567");
  });

  it("converts zero stroops to zero XLM", () => {
    expect(stroopsToXlm("0")).toBe("0.0000000");
  });

  it("converts the minimum unit (1 stroop)", () => {
    expect(stroopsToXlm("1")).toBe("0.0000001");
  });

  it("always returns exactly 7 decimal places", () => {
    const result = stroopsToXlm("5000000");
    expect(result).toBe("0.5000000");
    expect(result.split(".")[1]).toHaveLength(7);
  });
});
