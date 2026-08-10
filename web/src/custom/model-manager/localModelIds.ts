/**
 * Detect absolute local paths that must not be treated as Hugging Face repo ids.
 */
export function isFilesystemModelId(id: string): boolean {
  return (
    id.startsWith("/") ||
    /^[A-Za-z]:[\\/]/.test(id) ||
    id.startsWith("\\\\")
  );
}

/**
 * Hub repo id for download / delete / cache checks. Never return a filesystem path.
 */
export function hubRepoIdForModel(model: {
  repo_id?: string | null;
  id: string;
}): string | null {
  if (model.repo_id && !isFilesystemModelId(model.repo_id)) {
    return model.repo_id;
  }
  if (!isFilesystemModelId(model.id)) {
    return model.id;
  }
  return null;
}
