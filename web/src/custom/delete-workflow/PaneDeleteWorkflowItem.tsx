import { useCallback } from "react";
import DeleteIcon from "@mui/icons-material/Delete";

import ContextMenuItem from "../../components/context_menus/ContextMenuItem";
import { Divider } from "../../components/ui_primitives";
import { useNodes } from "../../contexts/NodeContext";
import { useWorkflowManager } from "../../contexts/WorkflowManagerContext";
import { requestDeleteWorkflow } from "./deleteWorkflowRequestStore";

interface PaneDeleteWorkflowItemProps {
  onClose: () => void;
}

export function PaneDeleteWorkflowItem({
  onClose
}: PaneDeleteWorkflowItemProps) {
  const workflow = useNodes((state) => state.workflow);
  const isHostWorkflow = useWorkflowManager((state) =>
    state.openWorkflows.some((open) => open.id === workflow.id)
  );

  const handleDelete = useCallback(() => {
    onClose();
    requestDeleteWorkflow({ id: workflow.id, name: workflow.name });
  }, [onClose, workflow.id, workflow.name]);

  if (!isHostWorkflow) {
    return null;
  }

  return (
    <>
      <Divider />
      <ContextMenuItem
        onClick={handleDelete}
        label="Delete Workflow"
        addButtonClassName="delete"
        IconComponent={<DeleteIcon />}
      />
    </>
  );
}
