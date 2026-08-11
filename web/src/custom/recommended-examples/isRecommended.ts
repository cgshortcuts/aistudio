import type { Workflow } from "../../stores/ApiTypes";

export const RECOMMENDED_TAG = "recommended";
export const AISTUDIO_TAG = "aistudio";

export const RECOMMENDED_CATEGORY_ID = "recommended";

export const RECOMMENDED_CATEGORY = {
  id: RECOMMENDED_CATEGORY_ID,
  label: "Recommended",
  tags: [RECOMMENDED_TAG, AISTUDIO_TAG],
  color: "#FBBF24"
} as const;

export const RECOMMENDED_HIDDEN_TAGS: string[] = [
  RECOMMENDED_TAG,
  AISTUDIO_TAG
];

export function isRecommendedExample(
  workflow: Pick<Workflow, "tags">
): boolean {
  const tags = workflow.tags ?? [];
  return tags.includes(RECOMMENDED_TAG) || tags.includes(AISTUDIO_TAG);
}

export function workflowsForRecommended(
  workflows: Workflow[]
): Workflow[] {
  return workflows.filter(isRecommendedExample);
}

export function workflowsForRecommendedFilter(
  workflows: Workflow[],
  categoryId: string
): Workflow[] | null {
  if (categoryId === "all") {
    return workflows;
  }
  if (categoryId === RECOMMENDED_CATEGORY_ID) {
    return workflowsForRecommended(workflows);
  }
  return null;
}
