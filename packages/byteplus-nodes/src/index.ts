import type { NodeClass } from "@nodetool-ai/node-sdk";
import { loadPackageAssetJson } from "@nodetool-ai/config";
import { registerProvider } from "@nodetool-ai/runtime";

import { loadBytePlusNodesFromManifest } from "./byteplus-factory.js";
import type { BytePlusManifestEntry } from "./byteplus-factory.js";
import { BytePlusProvider } from "./byteplus-provider.js";

export {
  loadBytePlusNodesFromManifest,
  createBytePlusNodeClass
} from "./byteplus-factory.js";
export type {
  BytePlusManifestEntry,
  BytePlusFieldDef,
  BytePlusFieldType
} from "./byteplus-factory.js";

export {
  DEFAULT_ARK_BASE,
  CREATE_TASK_PATH,
  arkBaseUrl,
  arkDownload,
  arkGenerateVideo,
  arkPoll,
  arkSubmit,
  buildTaskBody,
  getApiKey,
  pickVideoUrl,
  retryAfterMs,
  taskPath
} from "./byteplus-base.js";

export { BytePlusProvider } from "./byteplus-provider.js";
export {
  SEEDANCE_20_STANDARD,
  SEEDANCE_20_FAST,
  SEEDANCE_20_MINI,
  SEEDANCE_25_MODEL_ID_DEFAULT,
  SEEDANCE_25_MODEL_ENV,
  resolveSeedance25ModelId,
  resolveModelId
} from "./byteplus-models.js";

export { resolveAssetUrl, isSafeHttpUrl } from "./byteplus-assets.js";

function loadManifest(): BytePlusManifestEntry[] {
  return loadPackageAssetJson<BytePlusManifestEntry[]>(
    { pkg: "@nodetool-ai/byteplus-nodes", path: "byteplus-manifest.json" },
    import.meta.url
  );
}

export const BYTEPLUS_NODES: readonly NodeClass[] =
  loadBytePlusNodesFromManifest(loadManifest());

export function registerBytePlusNodes(registry: {
  register: (nodeClass: NodeClass) => void;
}): void {
  for (const nodeClass of BYTEPLUS_NODES) {
    registry.register(nodeClass);
  }
}

let providerRegistered = false;

/**
 * Register the BytePlus ModelArk provider. Idempotent — call once from
 * server bootstrap (CUSTOM FORK mount).
 */
export function registerBytePlusProvider(): void {
  if (providerRegistered) return;
  registerProvider("byteplus", BytePlusProvider, { BYTEPLUS_API_KEY: "" });
  providerRegistered = true;
}
