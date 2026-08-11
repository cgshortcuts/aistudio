/** @jsxImportSource @emotion/react */
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import { useNavigate } from "react-router-dom";
import { EditorButton, FlexRow, SPACING, Text, getSpacingPx } from "../../ui_primitives";
import { useWorkspaceTabsStore } from "../../../stores/WorkspaceTabsStore";

interface OpenModel3DButtonProps {
  assetId: string;
}

/**
 * Opens a generated mesh in the workspace 3D editor. Isolated so
 * `useNavigate` only runs when a 3D tile is actually on screen.
 */
export default function OpenModel3DButton({ assetId }: OpenModel3DButtonProps) {
  const navigate = useNavigate();
  const openTab = useWorkspaceTabsStore((s) => s.openTab);
  return (
    <FlexRow align="center" gap={1} sx={{ p: getSpacingPx(SPACING.lg) }}>
      <ViewInArIcon fontSize="small" />
      <Text size="small" sx={{ flex: 1, minWidth: 0 }}>
        3D model
      </Text>
      <EditorButton
        size="small"
        onClick={() => {
          openTab({
            type: "model3d",
            ref: assetId,
            mode: "edit",
            title: "3D model"
          });
          navigate("/workspace");
        }}
      >
        Open in 3D editor
      </EditorButton>
    </FlexRow>
  );
}
