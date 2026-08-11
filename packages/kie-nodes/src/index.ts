import { lazyReadonlyArray, type NodeClass } from "@nodetool-ai/node-sdk";
import { loadPackageAssetJson } from "@nodetool-ai/config";
import { loadKieNodesFromManifest } from "./kie-factory.js";
import type { KieManifestEntry } from "./kie-factory.js";

export { loadKieNodesFromManifest, createKieNodeClass } from "./kie-factory.js";
export type { KieManifestEntry } from "./kie-factory.js";
export {
  getApiKey,
  isRefSet,
  kieExecuteTask,
  kieExecuteOmniDirect,
  kieImageRef,
  parseCreditsConsumed,
  reportKieProviderCost,
  uploadAudioInput,
  uploadImageInput,
  uploadVideoInput
} from "./kie-base.js";
export type { KieExecuteResult } from "./kie-base.js";
export {
  buildVideoClipsFromRefs,
  readClipStart,
  readClipEnd,
  clampClipEnd,
  MAX_VIDEO_CLIP_SPAN
} from "./video-clip.js";
export type { VideoClipPayload } from "./video-clip.js";

function loadManifest(): KieManifestEntry[] {
  return loadPackageAssetJson<KieManifestEntry[]>(
    { pkg: "@nodetool-ai/kie-nodes", path: "kie-manifest.json" },
    import.meta.url
  );
}

let kieNodeClasses: readonly NodeClass[] | undefined;
function loadKieNodeClasses(): readonly NodeClass[] {
  return (kieNodeClasses ??= loadKieNodesFromManifest(loadManifest()));
}

export const KIE_NODES: readonly NodeClass[] = lazyReadonlyArray(loadKieNodeClasses);

export function registerKieNodes(registry: {
  register: (nodeClass: NodeClass) => void;
}): void {
  for (const nodeClass of loadKieNodeClasses()) {
    registry.register(nodeClass);
  }
}
