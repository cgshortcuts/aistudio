import { nextWorkflowSelection } from "../workflowListSelection";

const ids = ["a", "b", "c", "d", "e"];

describe("nextWorkflowSelection", () => {
  it("toggles a single id when shift is not held", () => {
    expect(nextWorkflowSelection(ids, [], "c", null, false)).toEqual(["c"]);
    expect(nextWorkflowSelection(ids, ["c"], "c", "c", false)).toEqual([]);
    expect(nextWorkflowSelection(ids, ["a"], "c", "a", false)).toEqual([
      "a",
      "c"
    ]);
  });

  it("selects the inclusive range from the anchor on shift+click", () => {
    expect(nextWorkflowSelection(ids, ["a"], "d", "a", true)).toEqual([
      "a",
      "b",
      "c",
      "d"
    ]);
  });

  it("selects the range when the click is above the anchor", () => {
    expect(nextWorkflowSelection(ids, ["e"], "b", "e", true)).toEqual([
      "e",
      "b",
      "c",
      "d"
    ]);
  });

  it("unions the range with the existing selection", () => {
    expect(nextWorkflowSelection(ids, ["a", "e"], "c", "a", true)).toEqual([
      "a",
      "e",
      "b",
      "c"
    ]);
  });

  it("falls back to toggle when there is no anchor", () => {
    expect(nextWorkflowSelection(ids, [], "c", null, true)).toEqual(["c"]);
  });

  it("falls back to toggle when the anchor is not in the visible list", () => {
    expect(nextWorkflowSelection(ids, ["z"], "c", "z", true)).toEqual([
      "z",
      "c"
    ]);
  });
});
