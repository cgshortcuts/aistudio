import { describe, expect, it } from "vitest";
import { lazyReadonlyArray } from "../src/lazy-node-list.js";

describe("lazyReadonlyArray", () => {
  it("does not call load until the array is read", () => {
    let calls = 0;
    const list = lazyReadonlyArray(() => {
      calls += 1;
      return ["a", "b"];
    });
    expect(calls).toBe(0);
    expect(Array.isArray(list)).toBe(true);
    expect(calls).toBe(0);
    expect(list.length).toBe(2);
    expect(calls).toBe(1);
    expect([...list]).toEqual(["a", "b"]);
    expect(calls).toBe(1);
  });

  it("supports the array methods pack tests use", () => {
    const list = lazyReadonlyArray(() => [1, 2, 3]);
    expect(list.filter((n) => n > 1)).toEqual([2, 3]);
    expect(list.map((n) => n * 2)).toEqual([2, 4, 6]);
    expect(list.find((n) => n === 2)).toBe(2);
    expect(list[0]).toBe(1);
  });
});
