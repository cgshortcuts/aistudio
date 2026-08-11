import type { Workflow } from "./ApiTypes";

/**
 * CAS token for `workflows.update`. A local-only workflow has a client-made
 * `updated_at` but no server `etag`. Sending that timestamp makes the server
 * treat the row as deleted (`NOT_FOUND`) instead of creating it.
 */
export function expectedUpdatedAtForSave(
  workflow: Pick<Workflow, "etag" | "updated_at">
): string | undefined {
  if (!workflow.etag) {
    return undefined;
  }
  return workflow.updated_at || undefined;
}
