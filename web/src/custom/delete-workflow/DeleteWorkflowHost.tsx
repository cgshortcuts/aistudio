import { useCallback } from "react";

import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import { useWorkflowManager } from "../../contexts/WorkflowManagerContext";
import {
  useDeleteWorkflowRequestStore
} from "./deleteWorkflowRequestStore";
import { performDeleteWorkflows } from "./performDeleteWorkflows";

export function DeleteWorkflowHost() {
  const workflowsToDelete = useDeleteWorkflowRequestStore(
    (state) => state.workflowsToDelete
  );
  const close = useDeleteWorkflowRequestStore((state) => state.close);
  const deleteWorkflow = useWorkflowManager((state) => state.delete);
  const removeWorkflow = useWorkflowManager((state) => state.removeWorkflow);

  const handleDelete = useCallback(() => {
    void performDeleteWorkflows(workflowsToDelete, {
      deleteWorkflow,
      removeWorkflow
    }).catch((error: unknown) => {
      console.error("Error deleting workflows:", error);
    });
  }, [deleteWorkflow, removeWorkflow, workflowsToDelete]);

  return (
    <ConfirmDialog
      open={workflowsToDelete.length > 0}
      onClose={close}
      onConfirm={handleDelete}
      confirmText="Delete"
      cancelText="Cancel"
      title="Delete Workflow"
      notificationMessage="Workflow deleted"
      notificationType="success"
      content={
        <>
          <p>Are you sure you want to delete the following workflow?</p>
          <ul className="asset-names">
            {workflowsToDelete.map((workflow) => (
              <li key={workflow.id}>{workflow.name}</li>
            ))}
          </ul>
        </>
      }
    />
  );
}
