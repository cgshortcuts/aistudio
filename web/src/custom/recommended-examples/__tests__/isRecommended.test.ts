/**
 * @jest-environment node
 */
import type { Workflow } from "../../../stores/ApiTypes";
import {
  RECOMMENDED_CATEGORY_ID,
  isRecommendedExample,
  workflowsForRecommended,
  workflowsForRecommendedFilter
} from "../isRecommended";

const makeWorkflow = (tags: string[], name = "Test"): Workflow =>
  ({
    id: `wf-${name}`,
    name,
    description: "",
    tags,
    graph: { nodes: [], edges: [] },
    access: "private",
    created_at: "2024-01-01",
    updated_at: "2024-01-01"
  }) as Workflow;

describe("isRecommendedExample", () => {
  it("matches the recommended tag", () => {
    expect(isRecommendedExample(makeWorkflow(["recommended", "image"]))).toBe(
      true
    );
  });

  it("matches the aistudio tag", () => {
    expect(isRecommendedExample(makeWorkflow(["aistudio", "video"]))).toBe(
      true
    );
  });

  it("returns false without those tags", () => {
    expect(isRecommendedExample(makeWorkflow(["image", "example"]))).toBe(
      false
    );
  });

  it("returns false when tags are missing", () => {
    const wf = makeWorkflow([]);
    (wf as unknown as Record<string, unknown>).tags = undefined;
    expect(isRecommendedExample(wf)).toBe(false);
  });
});

describe("workflowsForRecommended", () => {
  it("keeps only recommended examples", () => {
    const workflows = [
      makeWorkflow(["image"], "plain"),
      makeWorkflow(["recommended", "image"], "rec"),
      makeWorkflow(["aistudio"], "studio")
    ];
    expect(workflowsForRecommended(workflows).map((w) => w.name)).toEqual([
      "rec",
      "studio"
    ]);
  });

  it("uses a stable category id", () => {
    expect(RECOMMENDED_CATEGORY_ID).toBe("recommended");
  });
});

describe("workflowsForRecommendedFilter", () => {
  const workflows = [
    makeWorkflow(["image"], "plain"),
    makeWorkflow(["recommended"], "rec")
  ];

  it("returns every workflow for all", () => {
    expect(workflowsForRecommendedFilter(workflows, "all")).toEqual(workflows);
  });

  it("returns recommended workflows for that filter", () => {
    expect(
      workflowsForRecommendedFilter(workflows, "recommended")?.map((w) => w.name)
    ).toEqual(["rec"]);
  });

  it("returns null for other categories", () => {
    expect(workflowsForRecommendedFilter(workflows, "image")).toBeNull();
  });
});
