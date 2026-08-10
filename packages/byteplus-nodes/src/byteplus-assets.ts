/**
 * Resolve NodeTool image/video/audio refs to URLs ModelArk can fetch
 * (public https or data: URIs).
 */

import { loadMediaRefBytes } from "@nodetool-ai/runtime";
import type { MediaRefValue, ProcessingContext } from "@nodetool-ai/runtime";

const RAW_RGBA_MIME = "image/x-raw-rgba";

type AssetRef = {
  uri?: string;
  asset_id?: string | null;
  data?: string | Uint8Array;
  mime_type?: string;
  mimeType?: string;
  metadata?: { mime_type?: string };
};

type StorageLike = {
  retrieve: (uri: string) => Promise<Uint8Array | null> | Uint8Array | null;
};

export type AssetContext = {
  storage?: StorageLike | null;
  resolveAssetBytes?: (
    uri: string
  ) => Promise<{ bytes: Uint8Array | null }>;
};

function parseIpComponent(part: string): number | null {
  if (/^0x[0-9a-f]+$/i.test(part)) return parseInt(part.slice(2), 16);
  if (/^0[0-7]+$/.test(part)) return parseInt(part, 8);
  if (/^[0-9]+$/.test(part)) return parseInt(part, 10);
  return null;
}

function ipv4ToOctets(host: string): [number, number, number, number] | null {
  const parts = host.split(".");
  if (parts.length === 0 || parts.length > 4) return null;
  const nums: number[] = [];
  for (const part of parts) {
    const n = parseIpComponent(part);
    if (n === null || n < 0) return null;
    nums.push(n);
  }
  const n = nums.length;
  for (let i = 0; i < n - 1; i++) {
    if (nums[i] > 0xff) return null;
  }
  const tailOctets = 4 - (n - 1);
  const tail = nums[n - 1];
  if (tail < 0 || tail > 0xffffffff || tail >= 2 ** (tailOctets * 8)) {
    return null;
  }
  let value = tail;
  for (let i = 0; i < n - 1; i++) {
    value += nums[i] * 256 ** (3 - i);
  }
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff
  ];
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host === "0:0:0:0:0:0:0:1") return true;
  const octets = ipv4ToOctets(host);
  if (octets) {
    const [a, b] = octets;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  if (host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }
  return false;
}

export function isSafeHttpUrl(uri: string): boolean {
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  return !isPrivateOrLocalHost(u.hostname);
}

function defaultMimeFor(kind: "image" | "video" | "audio"): string {
  if (kind === "video") return "video/mp4";
  if (kind === "audio") return "audio/mpeg";
  return "image/png";
}

function guessMime(r: AssetRef, fallback: string): string {
  const raw = r.mime_type || r.mimeType || r.metadata?.mime_type;
  if (raw && raw !== RAW_RGBA_MIME) return raw;
  if (raw === RAW_RGBA_MIME) return "image/png";
  return fallback;
}

function bytesToDataUri(bytes: Uint8Array, mime: string): string {
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

function isEmptyRef(ref: unknown): boolean {
  if (ref == null) return true;
  if (typeof ref === "string") return ref.trim() === "";
  if (typeof ref !== "object") return true;
  const r = ref as AssetRef;
  if (typeof r.uri === "string" && r.uri.trim()) return false;
  if (typeof r.data === "string" && r.data.length > 0) return false;
  if (r.data instanceof Uint8Array && r.data.byteLength > 0) return false;
  if (r.asset_id != null && r.asset_id !== "") return false;
  return true;
}

/**
 * Resolve a media ref to a URL string ModelArk accepts, or null if empty.
 */
export async function resolveAssetUrl(
  ref: unknown,
  context: AssetContext | undefined,
  kind: "image" | "video" | "audio"
): Promise<string | null> {
  if (isEmptyRef(ref)) return null;

  if (typeof ref === "string") {
    if (isSafeHttpUrl(ref) || ref.startsWith("data:")) return ref;
    throw new Error(`BytePlus: unsupported ${kind} URL`);
  }

  const r = ref as AssetRef;

  if (typeof r.uri === "string" && (isSafeHttpUrl(r.uri) || r.uri.startsWith("data:"))) {
    return r.uri;
  }

  if (typeof r.data === "string" && r.data.startsWith("data:")) {
    return r.data;
  }

  if (typeof r.data === "string" && r.data.length > 0) {
    return bytesToDataUri(
      Buffer.from(r.data, "base64"),
      guessMime(r, defaultMimeFor(kind))
    );
  }

  if (r.data instanceof Uint8Array && r.data.byteLength > 0) {
    return bytesToDataUri(r.data, guessMime(r, defaultMimeFor(kind)));
  }

  if (r.uri && context?.storage) {
    try {
      const bytes = await context.storage.retrieve(r.uri);
      if (bytes && bytes.byteLength > 0) {
        return bytesToDataUri(
          new Uint8Array(bytes),
          guessMime(r, defaultMimeFor(kind))
        );
      }
    } catch {
      /* fall through */
    }
  }

  const isHttp =
    typeof r.uri === "string" &&
    (r.uri.startsWith("http://") || r.uri.startsWith("https://"));
  if (!isHttp) {
    const bytes = await loadMediaRefBytes(
      ref as MediaRefValue,
      context as unknown as ProcessingContext | undefined
    );
    if (bytes && bytes.byteLength > 0) {
      const mime =
        r.mime_type === RAW_RGBA_MIME || r.mimeType === RAW_RGBA_MIME
          ? "image/png"
          : guessMime(r, defaultMimeFor(kind));
      return bytesToDataUri(bytes, mime);
    }
  }

  if (r.uri && isSafeHttpUrl(r.uri)) {
    return r.uri;
  }

  throw new Error(
    `Cannot resolve ${kind} asset for BytePlus — no usable uri or inline data`
  );
}
