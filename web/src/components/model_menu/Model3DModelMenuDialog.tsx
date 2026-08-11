import React from "react";
import ModelMenuDialogBase from "./shared/ModelMenuDialogBase";
import type {
  Model3DModel,
  ModelPack,
  UnifiedModel
} from "../../stores/ApiTypes";
import { useModel3DModelMenuStore } from "../../stores/ModelMenuStore";
import { use3DModelsByProvider } from "../../hooks/useModelsByProvider";

export interface Model3DModelMenuDialogProps {
  open: boolean;
  onClose: () => void;
  onModelChange?: (model: Model3DModel) => void;
  anchorEl?: HTMLElement | null;
  recommendedModels?: UnifiedModel[];
  modelPacks?: ModelPack[];
}

function Model3DModelMenuDialog({
  open,
  onClose,
  onModelChange,
  anchorEl,
  recommendedModels,
  modelPacks
}: Model3DModelMenuDialogProps) {
  const modelData = use3DModelsByProvider({ task: "text_to_3d" });
  return (
    <ModelMenuDialogBase<Model3DModel>
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      modelData={modelData}
      onModelChange={onModelChange}
      title="Select 3D Model"
      searchPlaceholder="Search text-to-3D models..."
      storeHook={useModel3DModelMenuStore}
      modelType="model_3d_model"
      recommendedModels={recommendedModels}
      modelPacks={modelPacks}
    />
  );
}

export default React.memo(Model3DModelMenuDialog);
