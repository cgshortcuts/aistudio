import React, { useMemo } from "react";
import ModelMenuDialogBase from "./shared/ModelMenuDialogBase";
import type { MusicModel, ModelPack, UnifiedModel } from "../../stores/ApiTypes";
import { useMusicModelMenuStore } from "../../stores/ModelMenuStore";
import { useMusicModelsByProvider } from "../../hooks/useModelsByProvider";
import { isSoundModel } from "../../utils/musicModelKind";

export type MusicModelKind = "music" | "sound";

export interface MusicModelMenuDialogProps {
  open: boolean;
  onClose: () => void;
  onModelChange?: (model: MusicModel) => void;
  anchorEl?: HTMLElement | null;
  recommendedModels?: UnifiedModel[];
  modelPacks?: ModelPack[];
  /** Restrict the shared catalog to songs or sound effects. */
  kind?: MusicModelKind;
}

function MusicModelMenuDialog({
  open,
  onClose,
  onModelChange,
  anchorEl,
  recommendedModels,
  modelPacks,
  kind = "music"
}: MusicModelMenuDialogProps) {
  const modelData = useMusicModelsByProvider();
  const filtered = useMemo(() => {
    const models = (modelData.models ?? []).filter((model) =>
      kind === "sound" ? isSoundModel(model) : !isSoundModel(model)
    );
    return { ...modelData, models, providers: undefined };
  }, [kind, modelData]);
  const isSound = kind === "sound";
  return (
    <ModelMenuDialogBase<MusicModel>
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      modelData={filtered}
      onModelChange={onModelChange}
      title={isSound ? "Select Sound Model" : "Select Music Model"}
      searchPlaceholder={
        isSound
          ? "Search text-to-sound models..."
          : "Search text-to-music models..."
      }
      storeHook={useMusicModelMenuStore}
      modelType="music_model"
      recommendedModels={recommendedModels}
      modelPacks={modelPacks}
    />
  );
}

export default React.memo(MusicModelMenuDialog);
