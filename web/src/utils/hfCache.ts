import type { HfCacheStatusRequestItem } from "../serverState/checkHfCacheStatus";
import type { UnifiedModel } from "../stores/ApiTypes";
// === CUSTOM FORK START: model-manager ===
import { isFilesystemModelId } from "../custom/model-manager";
// === CUSTOM FORK END ===

export const isHfModel = (model: UnifiedModel): boolean => {
  const type = model.type ?? "";
  return (
    type.startsWith("hf.") ||
    type.startsWith("hf_") ||
    model.path != null ||
    model.allow_patterns != null ||
    model.ignore_patterns != null
  );
};

export const canCheckHfCache = (model: UnifiedModel): boolean => {
  const repoId = model.repo_id || model.id;
  // === CUSTOM FORK START: model-manager ===
  if (!repoId || isFilesystemModelId(repoId)) {
    return false;
  }
  // === CUSTOM FORK END ===
  return isHfModel(model);
};

export const getHfCacheKey = (model: UnifiedModel): string => {
  const repoId = model.repo_id || model.id;
  return model.path ? `${repoId}/${model.path}` : repoId;
};

export const buildHfCacheRequest = (
  model: UnifiedModel
): HfCacheStatusRequestItem | null => {
  if (!canCheckHfCache(model)) {
    return null;
  }
  const repoId = model.repo_id || model.id;
  // === CUSTOM FORK START: model-manager ===
  if (isFilesystemModelId(repoId)) {
    return null;
  }
  // === CUSTOM FORK END ===
  return {
    key: getHfCacheKey(model),
    repo_id: repoId,
    model_type: model.type ?? null,
    path: model.path ?? null,
    allow_patterns: model.path ? null : model.allow_patterns ?? null,
    ignore_patterns: model.path ? null : model.ignore_patterns ?? null
  };
};
