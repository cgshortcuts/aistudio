import type { Workflow } from "../../stores/ApiTypes";
import { closeWorkflowTabs } from "./closeWorkflowTabs";
import type { WorkflowDeleteTarget } from "./deleteWorkflowRequestStore";

export function toWorkflowForDelete(target: WorkflowDeleteTarget): Workflow {
  return {
    id: target.id,
    name: target.name,
    description: "",
    access: "private",
    created_at: "",
    updated_at: "",
    graph: { nodes: [], edges: [] }
  };
}

export async function performDeleteWorkflows(
  workflows: WorkflowDeleteTarget[],
  actions: {
    deleteWorkflow: (workflow: Workflow) => Promise<void>;
    removeWorkflow: (id: string) => void;
  }
): Promise<void> {
  await Promise.all(
    workflows.map((workflow) =>
      actions.deleteWorkflow(toWorkflowForDelete(workflow))
    )
  );
  for (const workflow of workflows) {
    actions.removeWorkflow(workflow.id);
  }
  closeWorkflowTabs(workflows.map((workflow) => workflow.id));
}
