import {
  lazyReadonlyArray,
  type NodeClass,
  type NodeRegistry
} from "@nodetool-ai/node-sdk";
import { loadPackageAssetJson } from "@nodetool-ai/config";
import { loadReplicateNodesFromManifest } from "./replicate-factory.js";
import type { ReplicateManifestEntry } from "./replicate-factory.js";

export { loadReplicateNodesFromManifest, createReplicateNodeClass } from "./replicate-factory.js";
export type { ReplicateManifestEntry } from "./replicate-factory.js";
export * from "./replicate-base.js";

function loadManifest(): ReplicateManifestEntry[] {
  return loadPackageAssetJson<ReplicateManifestEntry[]>(
    { pkg: "@nodetool-ai/replicate-nodes", path: "replicate-manifest.json" },
    import.meta.url
  );
}

let replicateNodeClasses: readonly NodeClass[] | undefined;
function loadReplicateNodeClasses(): readonly NodeClass[] {
  return (replicateNodeClasses ??= loadReplicateNodesFromManifest(loadManifest()));
}

export const REPLICATE_NODES: readonly NodeClass[] = lazyReadonlyArray(
  loadReplicateNodeClasses
);

export function registerReplicateNodes(registry: NodeRegistry): void {
  for (const nodeClass of loadReplicateNodeClasses()) {
    registry.register(nodeClass);
  }
}
