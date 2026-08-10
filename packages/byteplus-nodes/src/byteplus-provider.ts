/**
 * BytePlus ModelArk BaseProvider — Seedance text/image → video via your
 * ModelArk API key (resource packs and account balance on that project).
 */

import { BaseProvider } from "@nodetool-ai/runtime";
import type {
  ImageToVideoParams,
  Message,
  ProviderStreamItem,
  TextToVideoParams,
  VideoModel
} from "@nodetool-ai/runtime";
import { loadPackageAssetJson } from "@nodetool-ai/config";
import {
  arkGenerateVideo,
  buildTaskBody,
  getApiKey
} from "./byteplus-base.js";
import type { BytePlusManifestEntry } from "./byteplus-factory.js";
import {
  SEEDANCE_20_FAST,
  SEEDANCE_20_MINI,
  SEEDANCE_20_STANDARD,
  resolveSeedance25ModelId
} from "./byteplus-models.js";

function loadManifest(): BytePlusManifestEntry[] {
  try {
    return loadPackageAssetJson<BytePlusManifestEntry[]>(
      { pkg: "@nodetool-ai/byteplus-nodes", path: "byteplus-manifest.json" },
      import.meta.url
    );
  } catch {
    return [];
  }
}

function detectImageMime(image: Uint8Array): string {
  if (
    image.length >= 4 &&
    image[0] === 0x89 &&
    image[1] === 0x50 &&
    image[2] === 0x4e &&
    image[3] === 0x47
  ) {
    return "image/png";
  }
  if (image.length >= 3 && image[0] === 0xff && image[1] === 0xd8) {
    return "image/jpeg";
  }
  return "image/png";
}

function toDataUri(bytes: Uint8Array, mime: string): string {
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

export class BytePlusProvider extends BaseProvider {
  private readonly apiKey: string;

  static override requiredSecrets(): string[] {
    return ["BYTEPLUS_API_KEY"];
  }

  constructor(secrets: Record<string, unknown> = {}) {
    super("byteplus");
    this.apiKey =
      (secrets["BYTEPLUS_API_KEY"] as string) ||
      (secrets["ARK_API_KEY"] as string) ||
      "";
  }

  override getContainerEnv(): Record<string, string> {
    return { BYTEPLUS_API_KEY: this.apiKey };
  }

  private requireApiKey(): string {
    return getApiKey(
      this.apiKey ? { BYTEPLUS_API_KEY: this.apiKey } : undefined
    );
  }

  async generateMessage(
    _args: Parameters<BaseProvider["generateMessage"]>[0]
  ): Promise<Message> {
    throw new Error("byteplus does not support chat generation");
  }

  // eslint-disable-next-line require-yield
  async *generateMessages(
    _args: Parameters<BaseProvider["generateMessages"]>[0]
  ): AsyncGenerator<ProviderStreamItem> {
    throw new Error("byteplus does not support chat generation");
  }

  override async getAvailableVideoModels(): Promise<VideoModel[]> {
    if (!this.apiKey && !process.env.BYTEPLUS_API_KEY && !process.env.ARK_API_KEY) {
      return [];
    }
    const both = ["text_to_video", "image_to_video"] as const;
    const seedance25 = resolveSeedance25ModelId();
    const fromManifest = loadManifest()
      .filter((e) => e.outputType === "video" && e.modelId)
      .map((e) => ({
        id: e.modelIdEnv ? resolveSeedance25ModelId(e.modelId) : e.modelId,
        name: e.title,
        provider: "byteplus" as const,
        supportedTasks: [...both]
      }));

    if (fromManifest.length > 0) {
      // Dedupe by id (T2V/I2V share a ModelArk model id).
      const seen = new Set<string>();
      const out: VideoModel[] = [];
      for (const m of fromManifest) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);
        out.push(m);
      }
      return out;
    }

    return [
      {
        id: SEEDANCE_20_STANDARD,
        name: "Seedance 2.0 Standard",
        provider: "byteplus",
        supportedTasks: [...both]
      },
      {
        id: SEEDANCE_20_FAST,
        name: "Seedance 2.0 Fast",
        provider: "byteplus",
        supportedTasks: [...both]
      },
      {
        id: SEEDANCE_20_MINI,
        name: "Seedance 2.0 Mini",
        provider: "byteplus",
        supportedTasks: [...both]
      },
      {
        id: seedance25,
        name: "Seedance 2.5",
        provider: "byteplus",
        supportedTasks: [...both]
      }
    ];
  }

  override async textToVideo(params: TextToVideoParams): Promise<Uint8Array> {
    const apiKey = this.requireApiKey();
    const fields: Record<string, unknown> = {
      prompt: params.prompt
    };
    if (params.durationSeconds != null) fields.duration = params.durationSeconds;
    if (params.resolution) fields.resolution = params.resolution;
    if (params.aspectRatio) fields.ratio = params.aspectRatio;
    const body = buildTaskBody(params.model.id, fields);
    return arkGenerateVideo(apiKey, body);
  }

  override async imageToVideo(
    images: Uint8Array[],
    params: ImageToVideoParams
  ): Promise<Uint8Array> {
    const apiKey = this.requireApiKey();
    if (!images.length) {
      throw new Error("byteplus imageToVideo requires at least one image");
    }
    const first = toDataUri(images[0], detectImageMime(images[0]));
    const fields: Record<string, unknown> = {
      prompt: params.prompt ?? "",
      image: first
    };
    if (images[1]) {
      fields.last_image = toDataUri(images[1], detectImageMime(images[1]));
    }
    if (params.durationSeconds != null) fields.duration = params.durationSeconds;
    if (params.resolution) fields.resolution = params.resolution;
    if (params.aspectRatio) fields.ratio = params.aspectRatio;
    const body = buildTaskBody(params.model.id, fields);
    return arkGenerateVideo(apiKey, body);
  }
}
