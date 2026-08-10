/**
 * Dynamic BytePlus ModelArk node-class factory.
 *
 * Manifest entries declare Seedance model ids and UI fields. Generated classes
 * map those fields into ModelArk's `content[]` task body, then create → poll →
 * download via byteplus-base.
 */

import {
  applyContentCardBody,
  BaseNode,
  classifyFields,
  classNameToTitle,
  registerDeclaredProperty
} from "@nodetool-ai/node-sdk";
import type { NodeClass, PropOptions } from "@nodetool-ai/node-sdk";
import { mapPromptAssetsToInputs } from "@nodetool-ai/runtime";
import type {
  AssetMediaKind,
  PromptAssetInputField,
  PromptAssetTextField
} from "@nodetool-ai/runtime";
import {
  arkGenerateVideo,
  buildTaskBody,
  getApiKey
} from "./byteplus-base.js";
import {
  resolveAssetUrl,
  type AssetContext
} from "./byteplus-assets.js";

export type BytePlusFieldType =
  | "str"
  | "int"
  | "float"
  | "bool"
  | "enum"
  | "image"
  | "video"
  | "audio"
  | "list[image]"
  | "list[video]"
  | "list[audio]";

export interface BytePlusFieldDef {
  name: string;
  type: BytePlusFieldType;
  default?: unknown;
  title?: string;
  description?: string;
  values?: Array<string | number>;
  min?: number;
  max?: number;
  required?: boolean;
}

export interface BytePlusManifestEntry {
  className: string;
  moduleName: string;
  modality: "video";
  modelId: string;
  /** When set, resolveModelId prefers process.env[modelIdEnv]. */
  modelIdEnv?: string | null;
  outputType: "video";
  title: string;
  description: string;
  pollInterval: number;
  maxAttempts: number;
  fields: BytePlusFieldDef[];
}

const ASSET_TYPES = new Set<BytePlusFieldType>(["image", "video", "audio"]);
const LIST_ASSET_RE = /^list\[(image|video|audio)\]$/;

type ProcessContext = Parameters<BaseNode["process"]>[0] & AssetContext;

function coerceScalar(v: unknown, type: BytePlusFieldType): unknown {
  switch (type) {
    case "int": {
      if (typeof v === "number") return Math.trunc(v);
      const n = parseInt(String(v), 10);
      return Number.isNaN(n) ? null : n;
    }
    case "float": {
      if (typeof v === "number") return v;
      const f = parseFloat(String(v));
      return Number.isNaN(f) ? null : f;
    }
    case "bool": {
      if (typeof v === "boolean") return v;
      if (typeof v === "string") return v.toLowerCase() === "true";
      return Boolean(v);
    }
    default:
      return v;
  }
}

function defaultForType(type: BytePlusFieldType): unknown {
  switch (type) {
    case "bool":
      return false;
    case "int":
    case "float":
      return 0;
    case "image":
      return { type: "image", uri: "", asset_id: null, data: null, metadata: null };
    case "video":
      return {
        type: "video",
        uri: "",
        asset_id: null,
        data: null,
        metadata: null,
        duration: null,
        format: null
      };
    case "audio":
      return { type: "audio", uri: "", asset_id: null, data: null, metadata: null };
    case "list[image]":
    case "list[video]":
    case "list[audio]":
      return [];
    default:
      return "";
  }
}

function computeFieldClassification(fields: BytePlusFieldDef[]) {
  return classifyFields(fields.map((f) => ({ name: f.name, propType: f.type })));
}

function refHasSource(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const r = value as { uri?: string; data?: unknown; asset_id?: unknown };
  if (typeof r.uri === "string" && r.uri.trim() !== "") return true;
  if (typeof r.data === "string" && r.data.length > 0) return true;
  if (r.data instanceof Uint8Array && r.data.byteLength > 0) return true;
  return r.asset_id != null && r.asset_id !== "";
}

function promptAssetOverrides(
  instance: Record<string, unknown>,
  spec: BytePlusManifestEntry,
  context: ProcessContext | undefined
): Promise<Record<string, unknown>> {
  const textFields: PromptAssetTextField[] = [];
  const assetFields: PromptAssetInputField[] = [];
  for (const field of spec.fields) {
    const value = instance[field.name];
    if (ASSET_TYPES.has(field.type)) {
      assetFields.push({
        name: field.name,
        kind: field.type as AssetMediaKind,
        list: false,
        hasSource: refHasSource(value)
      });
      continue;
    }
    const listMatch = LIST_ASSET_RE.exec(field.type);
    if (listMatch) {
      assetFields.push({
        name: field.name,
        kind: listMatch[1] as AssetMediaKind,
        list: true,
        hasSource: Array.isArray(value) && value.some(refHasSource)
      });
      continue;
    }
    if (field.type === "str") {
      textFields.push({ name: field.name, value: String(value ?? "") });
    }
  }
  return mapPromptAssetsToInputs(textFields, assetFields, context);
}

export function createBytePlusNodeClass(spec: BytePlusManifestEntry): NodeClass {
  const nodeType = `byteplus.${spec.moduleName}.${spec.className}`;
  const title = spec.title || classNameToTitle(spec.className);
  const specRef = spec;

  const BytePlusNodeClass = class extends BaseNode {
    async process(
      context?: ProcessContext
    ): Promise<Record<string, unknown>> {
      const apiKey = getApiKey(this._secrets);
      const input: Record<string, unknown> = {};

      const overrides = await promptAssetOverrides(
        this as unknown as Record<string, unknown>,
        specRef,
        context
      );
      const readValue = (name: string): unknown =>
        name in overrides
          ? overrides[name]
          : (this as unknown as Record<string, unknown>)[name];

      for (const f of specRef.fields) {
        const v = readValue(f.name);

        if (ASSET_TYPES.has(f.type)) {
          const inner = f.type as "image" | "video" | "audio";
          const resolved =
            v == null ? null : await resolveAssetUrl(v, context, inner);
          if (resolved !== null) {
            input[f.name] = resolved;
          } else if (f.required) {
            throw new Error(
              `${specRef.title}: the ${inner} input "${f.title ?? f.name}" is empty — connect or upload a${inner === "image" ? "n" : ""} ${inner}`
            );
          }
          continue;
        }

        if (v === undefined || v === null) continue;

        const listMatch = LIST_ASSET_RE.exec(f.type);
        if (listMatch) {
          const inner = listMatch[1] as "image" | "video" | "audio";
          if (!Array.isArray(v)) continue;
          const resolved: string[] = [];
          for (const item of v) {
            const r = await resolveAssetUrl(item, context, inner);
            if (r !== null) resolved.push(r);
          }
          if (resolved.length > 0) input[f.name] = resolved;
          continue;
        }

        if (typeof v === "string" && v === "") continue;
        input[f.name] = coerceScalar(v, f.type);
      }

      const body = buildTaskBody(
        specRef.modelId,
        input,
        specRef.modelIdEnv
      );
      const bytes = await arkGenerateVideo(apiKey, body, {
        pollInterval: specRef.pollInterval ?? 5000,
        maxAttempts: specRef.maxAttempts ?? 600
      });

      const filename = `byteplus-video-${Date.now()}.mp4`;
      const mime = "video/mp4";
      const storage = context?.storage as
        | { store?: (k: string, b: Uint8Array, m?: string) => Promise<string> }
        | null
        | undefined;
      if (storage?.store) {
        try {
          const storageUri = await storage.store(filename, bytes, mime);
          return { output: { type: "video", uri: storageUri } };
        } catch {
          /* fall through to base64 embed */
        }
      }

      return {
        output: {
          type: "video",
          uri: "",
          data: Buffer.from(bytes).toString("base64")
        }
      };
    }
  };

  Object.defineProperty(BytePlusNodeClass, "name", {
    value: spec.className,
    configurable: true
  });
  Object.defineProperty(BytePlusNodeClass, "nodeType", {
    value: nodeType,
    configurable: true
  });
  Object.defineProperty(BytePlusNodeClass, "title", {
    value: title,
    configurable: true
  });
  Object.defineProperty(BytePlusNodeClass, "description", {
    value: spec.description,
    configurable: true
  });
  Object.defineProperty(BytePlusNodeClass, "requiredSettings", {
    value: ["BYTEPLUS_API_KEY"],
    configurable: true
  });
  Object.defineProperty(BytePlusNodeClass, "autoSaveAsset", {
    value: true,
    configurable: true
  });
  Object.defineProperty(BytePlusNodeClass, "metadataOutputTypes", {
    value: { output: "video" },
    configurable: true
  });
  applyContentCardBody(BytePlusNodeClass);

  const { inlineFields, inputFields } = computeFieldClassification(spec.fields);
  Object.defineProperty(BytePlusNodeClass, "inlineFields", {
    value: inlineFields,
    configurable: true
  });
  Object.defineProperty(BytePlusNodeClass, "inputFields", {
    value: inputFields,
    configurable: true
  });

  for (const field of spec.fields) {
    const propDefault =
      field.default === null ? null : field.default ?? defaultForType(field.type);
    const propOptions: PropOptions = {
      type: field.type,
      default: propDefault
    };
    if (field.title) propOptions.title = field.title;
    if (field.description) propOptions.description = field.description;
    if (field.values?.length) propOptions.values = field.values;
    if (field.min !== undefined) propOptions.min = field.min;
    if (field.max !== undefined) propOptions.max = field.max;
    if (field.required) propOptions.required = true;

    registerDeclaredProperty(BytePlusNodeClass, field.name, propOptions);
  }

  return BytePlusNodeClass as unknown as NodeClass;
}

export function loadBytePlusNodesFromManifest(
  manifest: BytePlusManifestEntry[]
): NodeClass[] {
  return manifest.map(createBytePlusNodeClass);
}
