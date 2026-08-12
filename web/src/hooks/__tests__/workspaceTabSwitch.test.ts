import {
  resolveAdjacentTabId,
  resolveTabIdAtIndex
} from "../workspaceTabSwitch";

describe("workspaceTabSwitch", () => {
  const tabs = [{ id: "a" }, { id: "b" }, { id: "c" }];

  describe("resolveAdjacentTabId", () => {
    it("returns null when there are no tabs", () => {
      expect(resolveAdjacentTabId([], "a", "next")).toBeNull();
    });

    it("activates the first tab when none is active", () => {
      expect(resolveAdjacentTabId(tabs, null, "next")).toBe("a");
    });

    it("cycles forward and wraps", () => {
      expect(resolveAdjacentTabId(tabs, "a", "next")).toBe("b");
      expect(resolveAdjacentTabId(tabs, "c", "next")).toBe("a");
    });

    it("cycles backward and wraps", () => {
      expect(resolveAdjacentTabId(tabs, "b", "prev")).toBe("a");
      expect(resolveAdjacentTabId(tabs, "a", "prev")).toBe("c");
    });
  });

  describe("resolveTabIdAtIndex", () => {
    it("returns the tab at the index", () => {
      expect(resolveTabIdAtIndex(tabs, 0)).toBe("a");
      expect(resolveTabIdAtIndex(tabs, 2)).toBe("c");
    });

    it("returns null for out-of-range indexes", () => {
      expect(resolveTabIdAtIndex(tabs, -1)).toBeNull();
      expect(resolveTabIdAtIndex(tabs, 3)).toBeNull();
    });
  });
});
