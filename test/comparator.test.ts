import { Compare } from "../src";

describe("Comparator", () => {
  it("equal returns true only on strict equality", () => {
    expect(Compare.is(5).equal(5)).toBe(true);
    expect(Compare.is(5).equal(6)).toBe(false);
  });

  it("notEqual returns true when values differ", () => {
    expect(Compare.is(5).notEqual(6)).toBe(true);
    expect(Compare.is(5).notEqual(5)).toBe(false);
  });

  it("in and notIn check membership", () => {
    expect(Compare.is("a").in(["a", "b"])).toBe(true);
    expect(Compare.is("z").in(["a", "b"])).toBe(false);
    expect(Compare.is("z").notIn(["a", "b"])).toBe(true);
    expect(Compare.is("a").notIn(["a", "b"])).toBe(false);
  });

  it("greaterThan and lesserThan compare values", () => {
    expect(Compare.is(10).greaterThan(5)).toBe(true);
    expect(Compare.is(3).greaterThan(5)).toBe(false);
    expect(Compare.is(3).lesserThan(5)).toBe(true);
    expect(Compare.is(8).lesserThan(5)).toBe(false);
  });
});
