import type { Chunk } from "@nodetool-ai/protocol";
import { createLogger } from "@nodetool-ai/config";
import { BaseProvider } from "./base-provider.js";
import { sniffAudioMime } from "./audio-mime.js";
import { safeFetch } from "./safe-url.js";

const log = createLogger("nodetool.runtime.providers.gemini");
import type {
  ASRModel,
  EmbeddingModel,
  ImageModel,
  ImageToImageParams,
  ImageToVideoParams,
  LanguageModel,
  Message,
  MessageContent,
  MessageAudioContent,
  MessageImageContent,
  MessageTextContent,
  ProviderStreamItem,
  ProviderTool,
  StreamingAudioChunk,
  TextToImageParams,
  ImageBatchSubmitParams,
  ImageBatchGetParams,
  ImageBatchJob,
  TextToVideoParams,
  ToolCall,
  TTSModel,
  VideoModel
} from "./types.js";
import { WEB_SEARCH_TOOL_NAME } from "./types.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Drop `; charset=…`/`; codecs=…` parameters from a Content-Type header. */
function stripMimeParams(value: string | null): string | undefined {
  const mime = value?.split(";")[0].trim();
  return mime || undefined;
}

/**
 * Normalize an audio mime to one Gemini's `inlineData` accepts. Gemini lists
 * audio/wav, audio/mp3, audio/aiff, audio/aac, audio/ogg and audio/flac; the
 * common `audio/mpeg` label is remapped to `audio/mp3`. Falls back to
 * `audio/mp3` when the type is unknown.
 */
function geminiAudioMime(mime: string | undefined): string {
  if (!mime) return "audio/mp3";
  if (mime === "audio/mpeg" || mime === "audio/mpga") return "audio/mp3";
  return mime;
}

interface GeminiProviderOptions {
  fetchFn?: typeof fetch;
}

/** A Gemini content part. */
interface GeminiPart {
  text?: string;
  thought?: boolean;
  inlineData?: { mimeType: string; data: string };
  functionCall?: {
    id?: string;
    name: string;
    args?: Record<string, unknown>;
  };
  functionResponse?: { id?: string; name: string; response: unknown };
  /** Thought signature — at part level, camelCase per Gemini API. */
  thoughtSignature?: string;
}

/** A Gemini content entry (role + parts). */
interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

/** Shape of Gemini generateContent / streamGenerateContent request body. */
interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: { parts: Array<{ text: string }> };
  tools?: Array<
    | { functionDeclarations: Array<Record<string, unknown>> }
    | { googleSearch: Record<string, never> }
    | { codeExecution: Record<string, never> }
  >;
  toolConfig?: {
    functionCallingConfig?: { mode: "ANY"; allowedFunctionNames?: string[] };
    /**
     * Required by Gemini when a built-in tool (googleSearch, codeExecution) is
     * sent alongside functionDeclarations — the API 400s without it.
     */
    includeServerSideToolInvocations?: boolean;
  };
  generationConfig?: Record<string, unknown>;
}

/** A single candidate in a Gemini response. */
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}

/** Top-level Gemini response shape. */
interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message?: string };
  promptFeedback?: { blockReason?: string; blockReasonMessage?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
  };
}

/** Shape of a model entry from the Gemini models list API. */
interface GeminiModelEntry {
  name?: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
}

interface GeminiModelsPage {
  models?: GeminiModelEntry[];
  nextPageToken?: string;
}

interface GeminiVideoOperation {
  name?: string;
  done?: boolean;
  error?: { message?: string; code?: number; status?: string };
  response?: {
    generateVideoResponse?: {
      generatedSamples?: Array<{ video?: { uri?: string } }>;
    };
    generatedVideos?: Array<{ video?: { uri?: string } }>;
  };
}

// Gemini's function-declaration schema is a strict subset of OpenAPI 3.0.
// It rejects JSON-Schema-only fields like `const`, `additionalProperties`,
// `$schema`, `$ref`, `definitions`, `patternProperties`, etc. Any one of these
// anywhere in the tree causes a 400 that aborts the entire tool batch, so we
// recursively strip them before sending. Zod 4's `z.toJSONSchema` (draft
// 2020-12) emits several of them — `const` for every `z.literal()`, `$ref` +
// `$defs` for every reused schema — so tools defined in Zod hit this.
const GEMINI_UNSUPPORTED_SCHEMA_KEYS = new Set([
  "additionalProperties",
  "$schema",
  "$id",
  "$ref",
  "$defs",
  "$comment",
  "definitions",
  "patternProperties",
  "propertyNames",
  "unevaluatedProperties",
  "unevaluatedItems",
  "dependentSchemas",
  "dependentRequired",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "const",
  "allOf",
  "oneOf",
  "not",
  "if",
  "then",
  "else",
  "prefixItems",
  "additionalItems",
  "contains",
  "minContains",
  "maxContains",
  "uniqueItems",
  "multipleOf",
  "examples",
  "readOnly",
  "writeOnly",
  "deprecated",
  "contentEncoding",
  "contentMediaType"
]);

/** Keywords whose value is data, not a schema — never recurse into them. */
const GEMINI_DATA_KEYS = new Set([
  "enum",
  "const",
  "default",
  "example",
  "examples"
]);

function isArraySchemaType(type: unknown): boolean {
  if (typeof type === "string") return type.toLowerCase() === "array";
  if (Array.isArray(type)) {
    return type.some(
      (t) => typeof t === "string" && t.toLowerCase() === "array"
    );
  }
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** The JSON Schema type name for a primitive literal, if it has one. */
function primitiveSchemaType(value: unknown): string | undefined {
  if (typeof value === "string") return "string";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? "integer" : "number";
  }
  return undefined;
}

function resolveJsonPointer(
  root: unknown,
  pointer: string
): { found: boolean; value: unknown } {
  if (pointer === "#" || pointer === "") return { found: true, value: root };
  if (!pointer.startsWith("#/")) return { found: false, value: undefined };
  let cursor: unknown = root;
  for (const rawSegment of pointer.slice(2).split("/")) {
    const segment = decodeURIComponent(rawSegment)
      .replace(/~1/g, "/")
      .replace(/~0/g, "~");
    if (Array.isArray(cursor)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= cursor.length) {
        return { found: false, value: undefined };
      }
      cursor = cursor[index];
      continue;
    }
    if (!isPlainObject(cursor) || !(segment in cursor)) {
      return { found: false, value: undefined };
    }
    cursor = cursor[segment];
  }
  return { found: true, value: cursor };
}

/**
 * Inline local `$ref`s so dropping `$defs` doesn't leave empty schemas behind.
 * A ref that is cyclic or unresolvable degrades to a permissive object.
 */
function inlineGeminiRefs(
  node: unknown,
  root: unknown,
  seen: ReadonlySet<string>
): unknown {
  if (Array.isArray(node)) {
    return node.map((item) => inlineGeminiRefs(item, root, seen));
  }
  if (!isPlainObject(node)) return node;

  if (typeof node.$ref === "string") {
    const { $ref, ...rest } = node;
    if (seen.has($ref)) return { type: "object", ...rest };
    const { found, value } = resolveJsonPointer(root, $ref);
    if (!found || !isPlainObject(value)) return { type: "object", ...rest };
    const resolved = inlineGeminiRefs(
      value,
      root,
      new Set([...seen, $ref])
    ) as Record<string, unknown>;
    const overrides = inlineGeminiRefs(rest, root, seen) as Record<
      string,
      unknown
    >;
    return { ...resolved, ...overrides };
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = GEMINI_DATA_KEYS.has(key)
      ? value
      : inlineGeminiRefs(value, root, seen);
  }
  return out;
}

/** Fold `allOf` members into the parent schema; parent keys win. */
function mergeAllOf(
  out: Record<string, unknown>,
  members: unknown[]
): Record<string, unknown> {
  for (const member of members) {
    const sanitized = sanitizeSchemaNode(member);
    if (!isPlainObject(sanitized)) continue;
    for (const [key, value] of Object.entries(sanitized)) {
      if (key === "properties" && isPlainObject(value)) {
        out.properties = { ...value, ...((out.properties as object) ?? {}) };
        continue;
      }
      if (key === "required" && Array.isArray(value)) {
        const existing = Array.isArray(out.required) ? out.required : [];
        out.required = [...new Set([...existing, ...value])];
        continue;
      }
      if (out[key] === undefined) out[key] = value;
    }
  }
  return out;
}

function sanitizeSchemaNode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeSchemaNode);
  if (!isPlainObject(value)) return value;

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (GEMINI_UNSUPPORTED_SCHEMA_KEYS.has(key)) continue;
    if (key === "properties" && isPlainObject(nested)) {
      const properties: Record<string, unknown> = {};
      // Property *names* are data — a property called "const" must survive.
      for (const [name, sub] of Object.entries(nested)) {
        properties[name] = sanitizeSchemaNode(sub);
      }
      out.properties = properties;
      continue;
    }
    if (key === "items") {
      out.items = sanitizeSchemaNode(
        Array.isArray(nested) ? (nested[0] ?? { type: "string" }) : nested
      );
      continue;
    }
    if (key === "anyOf" && Array.isArray(nested)) {
      out.anyOf = nested.map(sanitizeSchemaNode);
      continue;
    }
    out[key] = GEMINI_DATA_KEYS.has(key) ? nested : sanitizeSchemaNode(nested);
  }

  // `oneOf` means the same thing to a model as `anyOf`, which Gemini accepts.
  if (out.anyOf === undefined && Array.isArray(value.oneOf)) {
    out.anyOf = value.oneOf.map(sanitizeSchemaNode);
  }
  if (Array.isArray(value.allOf)) mergeAllOf(out, value.allOf);

  // `const` is what Zod emits for a literal. A single-value `enum` says the
  // same thing in Gemini's dialect, but only for strings — its `enum` is a
  // list of strings — so other literals keep the constraint in the description.
  if (value.const !== undefined && out.enum === undefined) {
    const literalType = primitiveSchemaType(value.const);
    if (literalType === "string") {
      out.enum = [value.const];
      out.type ??= "string";
    } else if (literalType) {
      out.type ??= literalType;
      const hint = `Must be ${JSON.stringify(value.const)}.`;
      out.description =
        typeof out.description === "string" && out.description
          ? `${out.description} ${hint}`
          : hint;
    }
  }

  // Gemini's `type` is one string; JSON Schema allows a union. `["x","null"]`
  // is Zod's optional/nullable shape and maps onto `nullable`.
  if (Array.isArray(out.type)) {
    const named = out.type.filter(
      (t): t is string => typeof t === "string" && t.toLowerCase() !== "null"
    );
    if (named.length < out.type.length) out.nullable = true;
    if (named.length > 0) out.type = named[0];
    else delete out.type;
  }

  // Gemini rejects an array schema that omits `items` ("items: missing
  // field"). JSON Schema allows it, so backfill a permissive default.
  if (isArraySchemaType(out.type) && out.items === undefined) {
    out.items = { type: "string" };
  }
  return out;
}

function sanitizeGeminiSchema(value: unknown): unknown {
  return sanitizeSchemaNode(inlineGeminiRefs(value, value, new Set()));
}

function sanitizeToolName(name: string): string {
  let sanitized = (name ?? "").trim();
  sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, "_");
  sanitized = sanitized.replace(/_+/g, "_");
  if (!sanitized) sanitized = "_tool";
  if (!/^[a-zA-Z_]/.test(sanitized)) sanitized = `_${sanitized}`;
  if (sanitized.length > 64) sanitized = sanitized.slice(0, 64);
  if (!sanitized) sanitized = "_tool";
  return sanitized;
}

function appendGeminiContent(
  contents: GeminiContent[],
  content: GeminiContent
): void {
  const previous = contents[contents.length - 1];
  if (previous?.role === content.role) {
    previous.parts.push(...content.parts);
  } else {
    contents.push(content);
  }
}

function geminiResponseError(data: GeminiResponse): Error | null {
  if (data.error?.message)
    return new Error(`Gemini API error: ${data.error.message}`);
  if (data.promptFeedback?.blockReason) {
    const detail = data.promptFeedback.blockReasonMessage
      ? `: ${data.promptFeedback.blockReasonMessage}`
      : "";
    return new Error(
      `Gemini prompt blocked (${data.promptFeedback.blockReason})${detail}`
    );
  }
  return null;
}

function parseGeminiResponse(value: unknown): GeminiResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Gemini returned an invalid response envelope");
  }
  const response = value as GeminiResponse;
  if (
    response.candidates !== undefined &&
    !Array.isArray(response.candidates)
  ) {
    throw new Error("Gemini returned invalid candidates");
  }
  for (const candidate of response.candidates ?? []) {
    if (
      candidate.content?.parts !== undefined &&
      !Array.isArray(candidate.content.parts)
    ) {
      throw new Error("Gemini returned invalid candidate parts");
    }
  }
  return response;
}

function normalizeEmbedding(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? values.map((value) => value / norm) : values;
}

function abortError(signal?: AbortSignal): Error {
  return signal?.reason instanceof Error
    ? signal.reason
    : new DOMException("Aborted", "AbortError");
}

async function* decodeGeminiSse(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): AsyncGenerator<GeminiResponse> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) throw abortError(signal);
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";
      if (done && buffer.trim()) {
        events.push(buffer);
        buffer = "";
      }
      for (const eventText of events) {
        const data = eventText
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n")
          .trim();
        if (!data || data === "[DONE]") continue;
        let parsed: unknown;
        try {
          parsed = JSON.parse(data);
        } catch (error) {
          throw new Error("Gemini returned malformed SSE JSON", {
            cause: error
          });
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Gemini returned an invalid SSE event");
        }
        yield parseGeminiResponse(parsed);
      }
      if (done) break;
    }
  } finally {
    // Stop the underlying connection whenever the consumer bails early (abort
    // or `break`); releasing the lock alone leaves the HTTP body undrained.
    await reader
      .cancel(signal?.aborted ? signal.reason : undefined)
      .catch(() => undefined);
    reader.releaseLock();
  }
}

type GeminiBatchPayload = {
  name?: string;
  done?: boolean;
  state?: string;
  metadata?: Record<string, unknown>;
  batch?: { name?: string; state?: string };
  dest?: Record<string, unknown>;
  response?: Record<string, unknown>;
  inlinedResponses?: unknown;
  error?: { message?: string } | string;
};

function readNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function recordOf(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

/** JOB_STATE_* / BATCH_STATE_* from any of the shapes Google returns. */
function geminiBatchRawState(data: GeminiBatchPayload): string | undefined {
  const meta = recordOf(data.metadata);
  const metaBatch = recordOf(meta?.batch);
  return (
    readNonEmptyString(data.state) ||
    readNonEmptyString(meta?.state) ||
    readNonEmptyString(data.batch?.state) ||
    readNonEmptyString(metaBatch?.state)
  );
}

function mapGeminiBatchStatus(
  raw: string | undefined,
  done?: boolean
): string {
  const state = (raw ?? "").toUpperCase();
  if (
    state === "JOB_STATE_SUCCEEDED" ||
    state === "BATCH_STATE_SUCCEEDED"
  ) {
    return "completed";
  }
  if (state === "JOB_STATE_FAILED" || state === "BATCH_STATE_FAILED") {
    return "failed";
  }
  if (
    state === "JOB_STATE_CANCELLED" ||
    state === "BATCH_STATE_CANCELLED"
  ) {
    return "cancelled";
  }
  if (state === "JOB_STATE_EXPIRED" || state === "BATCH_STATE_EXPIRED") {
    return "expired";
  }
  if (state === "JOB_STATE_RUNNING" || state === "BATCH_STATE_RUNNING") {
    return "in_progress";
  }
  if (
    state === "JOB_STATE_PENDING" ||
    state === "BATCH_STATE_PENDING" ||
    state === "JOB_STATE_UNSPECIFIED" ||
    state === "BATCH_STATE_UNSPECIFIED"
  ) {
    return "validating";
  }
  if (done) {
    return "completed";
  }
  return raw ? "validating" : "unknown";
}

function geminiBatchJobStatus(data: GeminiBatchPayload): string {
  return mapGeminiBatchStatus(geminiBatchRawState(data), data.done === true);
}

function unwrapInlinedResponseRows(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  const rec = recordOf(value);
  if (!rec) {
    return [];
  }
  const nested =
    rec.inlinedResponses ?? rec.inlined_responses ?? rec.responses;
  if (nested === value) {
    return [];
  }
  return unwrapInlinedResponseRows(nested);
}

function collectGeminiBatchInlineRows(data: GeminiBatchPayload): unknown[] {
  const dest = recordOf(data.dest) ?? {};
  const response = recordOf(data.response) ?? {};
  for (const candidate of [
    dest.inlinedResponses,
    dest.inlined_responses,
    response.inlinedResponses,
    response.inlined_responses,
    data.inlinedResponses
  ]) {
    const rows = unwrapInlinedResponseRows(candidate);
    if (rows.length > 0) {
      return rows;
    }
  }
  return [];
}

function extractInlineImageBytes(
  part: Record<string, unknown>
): Uint8Array | null {
  const inline = recordOf(part.inlineData) ?? recordOf(part.inline_data);
  const b64 = inline?.data;
  if (typeof b64 === "string" && b64.length > 0) {
    return Uint8Array.from(Buffer.from(b64, "base64"));
  }
  return null;
}

function extractImageFromGeminiResponse(resp: unknown): Uint8Array | null {
  const rec = recordOf(resp);
  if (!rec || !Array.isArray(rec.candidates)) {
    return null;
  }
  for (const cand of rec.candidates) {
    const content = recordOf(recordOf(cand)?.content);
    const parts = content?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }
    for (const part of parts) {
      const bytes = recordOf(part)
        ? extractInlineImageBytes(part as Record<string, unknown>)
        : null;
      if (bytes) {
        return bytes;
      }
    }
  }
  return null;
}

function geminiBatchOutputFileId(data: GeminiBatchPayload): string | null {
  const dest = recordOf(data.dest) ?? {};
  const response = recordOf(data.response) ?? {};
  return (
    readNonEmptyString(dest.fileName) ??
    readNonEmptyString(dest.file_name) ??
    readNonEmptyString(dest.responsesFile) ??
    readNonEmptyString(dest.responses_file) ??
    readNonEmptyString(response.responsesFile) ??
    readNonEmptyString(response.responses_file) ??
    null
  );
}

function geminiBatchErrorMessage(data: GeminiBatchPayload): string | null {
  if (typeof data.error === "string") {
    return data.error;
  }
  return readNonEmptyString(recordOf(data.error)?.message) ?? null;
}

export class GeminiProvider extends BaseProvider {
  static requiredSecrets(): string[] {
    return ["GEMINI_API_KEY"];
  }

  readonly apiKey: string;
  private _fetch: typeof fetch;

  constructor(
    secrets: { GEMINI_API_KEY?: string },
    options: GeminiProviderOptions = {}
  ) {
    super("gemini");

    const apiKey = secrets.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required");
    }

    this.apiKey = apiKey;
    this._fetch = options.fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  getContainerEnv(): Record<string, string> {
    return { GEMINI_API_KEY: this.apiKey };
  }

  async hasToolSupport(_model: string): Promise<boolean> {
    return true;
  }

  override get supportsNativeWebSearch(): boolean {
    return true;
  }

  // ---------------------------------------------------------------------------
  // Model listing
  // ---------------------------------------------------------------------------

  async getAvailableLanguageModels(): Promise<LanguageModel[]> {
    const items: GeminiModelEntry[] = [];
    let pageToken: string | undefined;
    try {
      do {
        const query = new URLSearchParams({
          key: this.apiKey,
          pageSize: "1000"
        });
        if (pageToken) query.set("pageToken", pageToken);
        const response = await this._fetch(
          `${GEMINI_API_BASE}/models?${query}`
        );
        if (!response.ok) return [];
        const payload = (await response.json()) as GeminiModelsPage;
        if (!Array.isArray(payload.models)) return [];
        items.push(...payload.models);
        pageToken = payload.nextPageToken;
      } while (pageToken);
    } catch {
      return [];
    }

    const seen = new Set<string>();
    return items
      .filter((m) =>
        (m.supportedGenerationMethods ?? []).includes("generateContent")
      )
      .filter((m) => !!m.name)
      .filter(
        (m) => !/(embedding|aqa|imagen|veo|image|tts)/i.test(m.name ?? "")
      )
      .map((m) => {
        const id = (m.name as string).split("/").pop() as string;
        if (seen.has(id)) return null;
        seen.add(id);
        return {
          id,
          name: m.displayName ?? id,
          provider: "gemini"
        };
      })
      .filter((model): model is LanguageModel => model !== null);
  }

  // ---------------------------------------------------------------------------
  // Message conversion helpers
  // ---------------------------------------------------------------------------

  private async messageContentToGeminiPart(
    content: MessageContent
  ): Promise<GeminiPart> {
    if (content.type === "text") {
      return { text: (content as MessageTextContent).text };
    }

    if (content.type === "image_url") {
      const img = (content as MessageImageContent).image;
      let base64Data: string;
      let mimeType = img.mimeType ?? "image/jpeg";

      const parseImageDataUri = (uri: string): string => {
        const idx = uri.indexOf(",");
        if (idx < 0) throw new Error("Invalid image data URI");
        const header = uri.slice(5, idx);
        mimeType = header.split(";")[0] || mimeType;
        return uri.slice(idx + 1);
      };

      if (
        (typeof img.data === "string" && img.data.length > 0) ||
        (img.data instanceof Uint8Array && img.data.length > 0)
      ) {
        if (typeof img.data === "string") {
          // Inline data may itself be a data: URI — strip the prefix and take
          // the real mime type from it rather than shipping the header as
          // base64 payload.
          base64Data = img.data.startsWith("data:")
            ? parseImageDataUri(img.data)
            : img.data;
        } else {
          base64Data = Buffer.from(img.data).toString("base64");
        }
      } else if (img.uri) {
        // resolveUri turns asset file:// URIs (what the chat pipeline produces)
        // into data: URIs; http(s) URIs pass through to safeFetch.
        const resolvedUri = img.uri.startsWith("data:")
          ? img.uri
          : await this.resolveUri(img.uri);
        if (resolvedUri.startsWith("data:")) {
          base64Data = parseImageDataUri(resolvedUri);
        } else {
          const resp = await safeFetch(resolvedUri, undefined, 5, this._fetch);
          if (!resp.ok)
            throw new Error(`Failed to fetch image: ${resp.status}`);
          mimeType =
            stripMimeParams(resp.headers.get("content-type")) ?? mimeType;
          base64Data = Buffer.from(await resp.arrayBuffer()).toString("base64");
        }
      } else {
        base64Data = "";
      }

      return { inlineData: { mimeType, data: base64Data } };
    }

    if (content.type === "audio") {
      const aud = (content as MessageAudioContent).audio;
      let base64Data: string;
      let mimeType = aud.mimeType;

      const parseAudioDataUri = (uri: string): string => {
        const idx = uri.indexOf(",");
        if (idx < 0) throw new Error("Invalid audio data URI");
        const header = uri.slice(5, idx);
        mimeType = mimeType ?? header.split(";")[0];
        return uri.slice(idx + 1);
      };

      if (
        (typeof aud.data === "string" && aud.data.length > 0) ||
        (aud.data instanceof Uint8Array && aud.data.length > 0)
      ) {
        if (typeof aud.data === "string") {
          base64Data = aud.data.startsWith("data:")
            ? parseAudioDataUri(aud.data)
            : aud.data;
          mimeType =
            mimeType ?? sniffAudioMime(Buffer.from(base64Data, "base64"));
        } else {
          const bytes = Buffer.from(aud.data);
          base64Data = bytes.toString("base64");
          mimeType = mimeType ?? sniffAudioMime(bytes);
        }
      } else if (aud.uri) {
        const resolvedUri = aud.uri.startsWith("data:")
          ? aud.uri
          : await this.resolveUri(aud.uri);
        if (resolvedUri.startsWith("data:")) {
          base64Data = parseAudioDataUri(resolvedUri);
        } else {
          const resp = await safeFetch(resolvedUri, undefined, 5, this._fetch);
          if (!resp.ok)
            throw new Error(`Failed to fetch audio: ${resp.status}`);
          const bytes = Buffer.from(await resp.arrayBuffer());
          mimeType =
            stripMimeParams(resp.headers.get("content-type")) ??
            mimeType ??
            sniffAudioMime(bytes);
          base64Data = bytes.toString("base64");
        }
      } else {
        base64Data = "";
      }

      return {
        inlineData: { mimeType: geminiAudioMime(mimeType), data: base64Data }
      };
    }

    return { text: "[unsupported content type]" };
  }

  /**
   * Convert our Message array into Gemini contents + optional system instruction.
   */
  async convertMessages(
    messages: Message[],
    nameMap: ReadonlyMap<string, string> = new Map()
  ): Promise<{ contents: GeminiContent[]; systemInstruction?: string }> {
    let systemInstruction: string | undefined;
    const contents: GeminiContent[] = [];

    // Gemini correlates a tool result to its call by the function *name*, not
    // by id (and our tool-call ids are synthesized — never valid Gemini
    // function names). Map each tool-call id back to its function name so the
    // `functionResponse.name` below matches the earlier `functionCall.name`.
    const toolCallNames = new Map<string, string>();
    for (const m of messages) {
      if (m.role === "assistant" && m.toolCalls) {
        for (const tc of m.toolCalls) {
          if (tc.id) toolCallNames.set(tc.id, nameMap.get(tc.name) ?? tc.name);
        }
      }
    }

    for (const msg of messages) {
      if (msg.role === "system") {
        const instruction =
          typeof msg.content === "string"
            ? msg.content
            : (msg.content ?? [])
                .filter((c): c is MessageTextContent => c.type === "text")
                .map((c) => c.text)
                .join(" ");
        systemInstruction = systemInstruction
          ? `${systemInstruction}\n${instruction}`
          : instruction;
        continue;
      }

      if (msg.role === "tool") {
        // Tool result → user role with functionResponse part. The name must
        // match the originating functionCall's name, resolved from the call id.
        const responseText =
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content);

        const functionName =
          (msg.toolCallId ? toolCallNames.get(msg.toolCallId) : undefined) ??
          msg.toolCallId ??
          "unknown";

        const responsePart: GeminiPart = {
          functionResponse: {
            name: functionName,
            id: msg.toolCallId ?? undefined,
            response: { result: responseText }
          }
        };

        // Merge parallel tool results into a single user turn so the request
        // keeps alternating user/model roles.
        const prev = contents[contents.length - 1];
        if (
          prev &&
          prev.role === "user" &&
          prev.parts.length > 0 &&
          prev.parts.every((p) => p.functionResponse !== undefined)
        ) {
          prev.parts.push(responsePart);
        } else {
          appendGeminiContent(contents, {
            role: "user",
            parts: [responsePart]
          });
        }
        continue;
      }

      if (msg.role === "assistant") {
        // If we have raw Gemini parts (with thought content), replay them exactly
        if (msg._rawGeminiParts && Array.isArray(msg._rawGeminiParts)) {
          appendGeminiContent(contents, {
            role: "model",
            parts: msg._rawGeminiParts as GeminiPart[]
          });
          continue;
        }

        const parts: GeminiPart[] = [];

        if (msg.toolCalls && msg.toolCalls.length > 0) {
          for (const tc of msg.toolCalls) {
            const part: GeminiPart = {
              functionCall: {
                id: tc.id,
                name: nameMap.get(tc.name) ?? tc.name,
                args: tc.args
              }
            };
            if (tc.thought_signature) {
              part.thoughtSignature = tc.thought_signature;
            }
            parts.push(part);
          }
        }

        if (typeof msg.content === "string" && msg.content) {
          parts.push({ text: msg.content });
        } else if (Array.isArray(msg.content)) {
          for (const c of msg.content) {
            parts.push(await this.messageContentToGeminiPart(c));
          }
        }

        if (parts.length > 0) {
          appendGeminiContent(contents, { role: "model", parts });
        }
        continue;
      }

      const parts: GeminiPart[] = [];
      if (typeof msg.content === "string") {
        parts.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const c of msg.content) {
          parts.push(await this.messageContentToGeminiPart(c));
        }
      }
      if (parts.length > 0) {
        appendGeminiContent(contents, { role: "user", parts });
      }
    }

    return { contents, systemInstruction };
  }

  formatTools(tools: ProviderTool[]): {
    geminiTools: Array<{
      functionDeclarations: Array<Record<string, unknown>>;
    }>;
    nameMap: Map<string, string>;
    reverseMap: Map<string, string>;
  } {
    const nameMap = new Map<string, string>();
    const reverseMap = new Map<string, string>();
    const usedNames = new Set<string>();
    const declarations: Array<Record<string, unknown>> = [];

    for (const tool of tools) {
      if (
        tool.name === WEB_SEARCH_TOOL_NAME ||
        tool.type === "code_interpreter"
      ) {
        continue;
      }
      const original = tool.name;
      let unique = sanitizeToolName(original);

      let suffix = 2;
      while (usedNames.has(unique)) {
        const sfx = `_${suffix}`;
        unique = `${sanitizeToolName(original).slice(0, 64 - sfx.length)}${sfx}`;
        suffix++;
      }

      usedNames.add(unique);
      nameMap.set(original, unique);
      reverseMap.set(unique, original);

      const rawParameters = tool.inputSchema ?? {
        type: "object",
        properties: {}
      };
      declarations.push({
        name: unique,
        description: tool.description ?? "",
        parameters: sanitizeGeminiSchema(rawParameters) as Record<
          string,
          unknown
        >
      });
    }

    return {
      geminiTools:
        declarations.length > 0 ? [{ functionDeclarations: declarations }] : [],
      nameMap,
      reverseMap
    };
  }

  /**
   * Fill in `tools` and `toolConfig` on a request body.
   *
   * Built-in tools (googleSearch, codeExecution) run server side. When they are
   * combined with functionDeclarations, Gemini rejects the request unless
   * `toolConfig.includeServerSideToolInvocations` is set — the built-in calls
   * and their results have to be echoed back into the conversation for the
   * function-calling loop to stay coherent.
   */
  private applyTools(
    body: GeminiRequest,
    tools: ProviderTool[],
    geminiTools: Array<{
      functionDeclarations: Array<Record<string, unknown>>;
    }>,
    nameMap: Map<string, string>,
    toolChoice?: string | "any"
  ): void {
    if (geminiTools.length > 0) {
      body.tools = geminiTools;
    }

    let hasBuiltIn = false;
    if (tools.some((tool) => tool.name === WEB_SEARCH_TOOL_NAME)) {
      body.tools = [...(body.tools ?? []), { googleSearch: {} }];
      hasBuiltIn = true;
    }
    if (tools.some((tool) => tool.type === "code_interpreter")) {
      body.tools = [...(body.tools ?? []), { codeExecution: {} }];
      hasBuiltIn = true;
    }

    const toolConfig: NonNullable<GeminiRequest["toolConfig"]> = {};

    if (hasBuiltIn && geminiTools.length > 0) {
      toolConfig.includeServerSideToolInvocations = true;
    }

    if (
      toolChoice &&
      (toolChoice === "any" ? geminiTools.length > 0 : nameMap.has(toolChoice))
    ) {
      const selected =
        toolChoice === "any"
          ? undefined
          : (nameMap.get(toolChoice) ?? sanitizeToolName(toolChoice));
      toolConfig.functionCallingConfig = {
        mode: "ANY",
        ...(selected ? { allowedFunctionNames: [selected] } : {})
      };
    }

    if (Object.keys(toolConfig).length > 0) {
      body.toolConfig = toolConfig;
    }
  }

  // ---------------------------------------------------------------------------
  // Non-streaming generation
  // ---------------------------------------------------------------------------

  async generateMessage(args: {
    messages: Message[];
    model: string;
    tools?: ProviderTool[];
    toolChoice?: string | "any";
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    signal?: AbortSignal;
  }): Promise<Message> {
    const {
      model,
      tools = [],
      maxTokens = 16384,
      temperature,
      topP,
      presencePenalty,
      frequencyPenalty
    } = args;

    const { geminiTools, nameMap, reverseMap } = this.formatTools(tools);
    const { contents, systemInstruction } = await this.convertMessages(
      args.messages,
      nameMap
    );

    const body: GeminiRequest = { contents };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    this.applyTools(body, tools, geminiTools, nameMap, args.toolChoice);

    const generationConfig: Record<string, unknown> = {
      maxOutputTokens: maxTokens
    };
    if (temperature != null) generationConfig.temperature = temperature;
    if (topP != null) generationConfig.topP = topP;
    if (presencePenalty != null)
      generationConfig.presencePenalty = presencePenalty;
    if (frequencyPenalty != null)
      generationConfig.frequencyPenalty = frequencyPenalty;
    body.generationConfig = generationConfig;

    log.debug("Gemini request", { model });

    const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${this.apiKey}`;
    this.recordRequestPayload(body);
    const response = await this._fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: args.signal
    });

    if (!response.ok) {
      const text = await response.text();
      log.error("Gemini request failed", {
        model,
        error: `${response.status}: ${text.slice(0, 200)}`
      });
      throw new Error(`Gemini API error ${response.status}: ${text}`);
    }

    const data = parseGeminiResponse(await response.json());

    const dataError = geminiResponseError(data);
    if (dataError) throw dataError;

    this.trackGeminiUsage(model, data.usageMetadata);

    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("Gemini returned no candidates");
    }

    return this.extractMessage(candidate.content.parts, reverseMap);
  }

  /** Record token usage from a Gemini usageMetadata block (if present). */
  private trackGeminiUsage(
    model: string,
    usage: GeminiResponse["usageMetadata"]
  ): void {
    if (!usage) return;
    this.trackUsage(model, {
      inputTokens: usage.promptTokenCount ?? 0,
      outputTokens:
        (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
      cachedTokens: usage.cachedContentTokenCount ?? 0
    });
  }

  // ---------------------------------------------------------------------------
  // Streaming generation
  // ---------------------------------------------------------------------------

  async *generateMessages(args: {
    messages: Message[];
    model: string;
    tools?: ProviderTool[];
    toolChoice?: string | "any";
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    audio?: Record<string, unknown>;
    signal?: AbortSignal;
  }): AsyncGenerator<ProviderStreamItem> {
    const {
      model,
      tools = [],
      maxTokens = 16384,
      temperature,
      topP,
      presencePenalty,
      frequencyPenalty
    } = args;

    const { geminiTools, nameMap, reverseMap } = this.formatTools(tools);
    const { contents, systemInstruction } = await this.convertMessages(
      args.messages,
      nameMap
    );

    const body: GeminiRequest = { contents };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    this.applyTools(body, tools, geminiTools, nameMap, args.toolChoice);

    const generationConfig: Record<string, unknown> = {
      maxOutputTokens: maxTokens
    };
    if (temperature != null) generationConfig.temperature = temperature;
    if (topP != null) generationConfig.topP = topP;
    if (presencePenalty != null)
      generationConfig.presencePenalty = presencePenalty;
    if (frequencyPenalty != null)
      generationConfig.frequencyPenalty = frequencyPenalty;
    body.generationConfig = generationConfig;

    log.debug("Gemini request", { model });

    const url = `${GEMINI_API_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    this.recordRequestPayload(body);
    const response = await this._fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: args.signal
    });

    if (!response.ok) {
      const text = await response.text();
      log.error("Gemini request failed", {
        model,
        error: `${response.status}: ${text.slice(0, 200)}`
      });
      throw new Error(`Gemini API error ${response.status}: ${text}`);
    }

    if (!response.body) {
      throw new Error("Gemini streaming response has no body");
    }

    // Accumulate all parts across SSE events for raw replay.
    // Gemini thinking models emit thought parts and function calls across
    // separate SSE events, but they must all be sent back together.
    const allParts: GeminiPart[] = [];
    const pendingToolCalls: ToolCall[] = [];
    // Gemini SSE reports CUMULATIVE usageMetadata; keep the last one seen and
    // record it once after the stream (accumulating each event would over-count).
    let lastUsage: GeminiResponse["usageMetadata"];

    for await (const event of decodeGeminiSse(response.body, args.signal)) {
      const eventError = geminiResponseError(event);
      if (eventError) throw eventError;
      if (event.usageMetadata) lastUsage = event.usageMetadata;

      const parts = event.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        allParts.push(part);

        if (part.text !== undefined && !part.thought) {
          const chunk: Chunk = {
            type: "chunk",
            content: part.text,
            done: false
          };
          yield chunk;
        } else if (part.functionCall) {
          const originalName =
            reverseMap.get(part.functionCall.name) ?? part.functionCall.name;
          const toolCall: ToolCall = {
            id:
              part.functionCall.id ??
              `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: originalName,
            args: part.functionCall.args ?? {}
          };
          if (part.thoughtSignature) {
            toolCall.thought_signature = part.thoughtSignature;
          }
          pendingToolCalls.push(toolCall);
        }
      }
    }

    this.trackGeminiUsage(model, lastUsage);

    // Attach accumulated raw parts to tool calls for thought replay
    const hasThoughts = allParts.some((p) => p.thought || p.thoughtSignature);
    for (const tc of pendingToolCalls) {
      if (hasThoughts) {
        tc._rawGeminiParts = allParts;
      }
      yield tc;
    }

    // Emit synthetic done chunk
    const doneChunk: Chunk = {
      type: "chunk",
      content: "",
      done: true
    };
    yield doneChunk;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private extractMessage(
    parts: GeminiPart[],
    reverseMap: Map<string, string>
  ): Message {
    const textParts: string[] = [];
    const toolCalls: ToolCall[] = [];

    for (const part of parts) {
      if (part.text !== undefined && !part.thought) {
        textParts.push(part.text);
      } else if (part.functionCall) {
        const originalName =
          reverseMap.get(part.functionCall.name) ?? part.functionCall.name;
        const tc: ToolCall = {
          id:
            part.functionCall.id ??
            `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: originalName,
          args: part.functionCall.args ?? {}
        };
        if (part.thoughtSignature) {
          tc.thought_signature = part.thoughtSignature;
        }
        toolCalls.push(tc);
      }
    }

    const hasThoughts = parts.some((p) => p.thought || p.thoughtSignature);
    const msg: Message = {
      role: "assistant",
      content: textParts.join("") || null,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };
    if (hasThoughts) {
      msg._rawGeminiParts = parts;
    }
    return msg;
  }

  // ---------------------------------------------------------------------------
  // Model listing — image, TTS, ASR, video, embedding
  // ---------------------------------------------------------------------------

  async getAvailableImageModels(): Promise<ImageModel[]> {
    return [
      {
        id: "gemini-3.1-flash-image",
        name: "Gemini 3.1 Flash Image",
        provider: "gemini",
        supportedTasks: ["text_to_image", "image_to_image"],
        aspectRatios: [
          "1:1",
          "2:3",
          "3:2",
          "3:4",
          "4:3",
          "4:5",
          "5:4",
          "9:16",
          "16:9",
          "21:9"
        ],
        resolutions: ["1K", "2K", "4K"]
      },
      {
        id: "gemini-3.1-flash-lite-image",
        name: "Gemini 3.1 Flash-Lite Image",
        provider: "gemini",
        supportedTasks: ["text_to_image", "image_to_image"],
        aspectRatios: ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9"]
      },
      {
        id: "gemini-3-pro-image",
        name: "Gemini 3 Pro Image",
        provider: "gemini",
        supportedTasks: ["text_to_image", "image_to_image"],
        aspectRatios: [
          "1:1",
          "2:3",
          "3:2",
          "3:4",
          "4:3",
          "4:5",
          "5:4",
          "9:16",
          "16:9",
          "21:9"
        ],
        resolutions: ["1K", "2K", "4K"]
      },
      {
        id: "imagen-4.0-generate-001",
        name: "Imagen 4",
        provider: "gemini",
        supportedTasks: ["text_to_image"],
        aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"]
      }
    ];
  }

  async getAvailableTTSModels(): Promise<TTSModel[]> {
    const voices = [
      "Zephyr",
      "Puck",
      "Charon",
      "Kore",
      "Fenrir",
      "Leda",
      "Orus",
      "Aoede",
      "Callirrhoe",
      "Autonoe",
      "Enceladus",
      "Iapetus",
      "Umbriel",
      "Algieba",
      "Despina",
      "Erinome",
      "Algenib",
      "Rasalgethi",
      "Laomedeia",
      "Achernar",
      "Alnilam",
      "Schedar",
      "Gacrux",
      "Pulcherrima",
      "Achird",
      "Zubenelgenubi",
      "Vindemiatrix",
      "Sadachbia",
      "Sadaltager",
      "Sulafat"
    ];
    return [
      {
        id: "gemini-3.1-flash-tts-preview",
        name: "Gemini 3.1 Flash TTS Preview",
        provider: "gemini",
        voices
      },
      {
        id: "gemini-2.5-flash-preview-tts",
        name: "Gemini 2.5 Flash TTS",
        provider: "gemini",
        voices
      },
      {
        id: "gemini-2.5-pro-preview-tts",
        name: "Gemini 2.5 Pro TTS",
        provider: "gemini",
        voices
      }
    ];
  }

  async getAvailableASRModels(): Promise<ASRModel[]> {
    return [
      {
        id: "gemini-3.5-flash",
        name: "Gemini 3.5 Flash",
        provider: "gemini"
      },
      {
        id: "gemini-3.1-flash-lite",
        name: "Gemini 3.1 Flash-Lite",
        provider: "gemini"
      }
    ];
  }

  override async getAvailableVideoModels(): Promise<VideoModel[]> {
    return [
      {
        id: "veo-3.1-generate-preview",
        name: "Veo 3.1 Preview",
        provider: "gemini",
        supportedTasks: ["text_to_video", "image_to_video"]
      },
      {
        id: "veo-3.1-fast-generate-preview",
        name: "Veo 3.1 Fast Preview",
        provider: "gemini",
        supportedTasks: ["text_to_video", "image_to_video"]
      },
      {
        id: "veo-3.1-lite-generate-preview",
        name: "Veo 3.1 Lite Preview",
        provider: "gemini",
        supportedTasks: ["text_to_video", "image_to_video"]
      }
    ];
  }

  async getAvailableEmbeddingModels(): Promise<EmbeddingModel[]> {
    return [
      {
        id: "gemini-embedding-2",
        name: "Gemini Embedding 2",
        provider: "gemini",
        dimensions: 3072
      }
    ];
  }

  // ---------------------------------------------------------------------------
  // Embeddings
  // ---------------------------------------------------------------------------

  override async generateEmbedding(args: {
    text: string | string[];
    model: string;
    dimensions?: number;
  }): Promise<number[][]> {
    const { text, model, dimensions } = args;
    if (!text || (Array.isArray(text) && text.length === 0)) {
      throw new Error("text must not be empty");
    }

    const texts = typeof text === "string" ? [text] : text;

    // Gemini embedContent supports a single content; batch by calling per text
    const embeddings: number[][] = [];
    for (const t of texts) {
      const body: Record<string, unknown> = {
        content: { parts: [{ text: t }] }
      };
      if (dimensions) {
        body.outputDimensionality = dimensions;
      }

      const url = `${GEMINI_API_BASE}/models/${model}:embedContent?key=${this.apiKey}`;
      const response = await this._fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `Gemini embedding error ${response.status}: ${errText}`
        );
      }

      const data = (await response.json()) as {
        embedding?: { values?: number[] };
      };
      if (!data.embedding?.values) {
        throw new Error("No embedding returned from Gemini API");
      }
      embeddings.push(
        dimensions && dimensions < 3072
          ? normalizeEmbedding(data.embedding.values)
          : data.embedding.values
      );
    }

    return embeddings;
  }

  // ---------------------------------------------------------------------------
  // Text-to-image
  // ---------------------------------------------------------------------------

  override async textToImage(params: TextToImageParams): Promise<Uint8Array> {
    if (!params.prompt) {
      throw new Error("The input prompt cannot be empty.");
    }

    const modelId = params.model.id;

    if (modelId.startsWith("gemini-")) {
      // Use generateContent with IMAGE response modality
      const imageConfig: Record<string, unknown> = {};
      if (params.aspectRatio) imageConfig.aspectRatio = params.aspectRatio;
      if (params.resolution) imageConfig.imageSize = params.resolution;
      const body = {
        contents: [{ role: "user" as const, parts: [{ text: params.prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          ...(Object.keys(imageConfig).length > 0 ? { imageConfig } : {})
        }
      };

      const url = `${GEMINI_API_BASE}/models/${modelId}:generateContent?key=${this.apiKey}`;
      const response = await this._fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `Gemini text-to-image failed ${response.status}: ${errText}`
        );
      }

      const data = parseGeminiResponse(await response.json());
      const parts = data.candidates?.[0]?.content?.parts;
      if (!parts) throw new Error("No candidates in response");

      for (const part of parts) {
        if (part.inlineData?.data) {
          return Uint8Array.from(Buffer.from(part.inlineData.data, "base64"));
        }
      }
      throw new Error("No image data returned in response");
    }

    // Imagen models use the predict endpoint.
    const parameters: Record<string, unknown> = { sampleCount: 1 };
    if (params.aspectRatio) parameters.aspectRatio = params.aspectRatio;
    if (params.seed != null) parameters.seed = params.seed;
    if (params.safetyCheck === false)
      parameters.safetyFilterLevel = "block_only_high";
    const body: Record<string, unknown> = {
      instances: [{ prompt: params.prompt }],
      parameters
    };

    const url = `${GEMINI_API_BASE}/models/${modelId}:predict?key=${this.apiKey}`;
    const response = await this._fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Gemini image generation failed ${response.status}: ${errText}`
      );
    }

    const data = (await response.json()) as {
      predictions?: Array<{ bytesBase64Encoded?: string }>;
      generatedImages?: Array<{ image?: { imageBytes?: string } }>;
    };

    // Try predictions format first (Vertex-style), then generatedImages
    const b64 =
      data.predictions?.[0]?.bytesBase64Encoded ??
      data.generatedImages?.[0]?.image?.imageBytes;

    if (!b64) throw new Error("No image data in response");
    return Uint8Array.from(Buffer.from(b64, "base64"));
  }

  // ---------------------------------------------------------------------------
  // Image-to-image
  // ---------------------------------------------------------------------------

  override async imageToImage(
    images: Uint8Array[],
    params: ImageToImageParams
  ): Promise<Uint8Array> {
    if (!params.prompt) {
      throw new Error("The input prompt cannot be empty.");
    }

    const modelId = params.model.id;
    if (!modelId.startsWith("gemini-")) {
      throw new Error(
        `Model ${modelId} does not support image-to-image. Only gemini-* models supported.`
      );
    }

    const imageParts = images
      .filter((b) => b && b.length > 0)
      .map((b) => ({
        inlineData: {
          mimeType: "image/png",
          data: Buffer.from(b).toString("base64")
        }
      }));
    if (imageParts.length === 0) {
      throw new Error("At least one input image is required");
    }

    const imageConfig: Record<string, unknown> = {};
    if (params.aspectRatio) imageConfig.aspectRatio = params.aspectRatio;
    if (params.resolution) imageConfig.imageSize = params.resolution;
    const body = {
      contents: [
        {
          role: "user" as const,
          parts: [{ text: params.prompt }, ...imageParts]
        }
      ],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        ...(Object.keys(imageConfig).length > 0 ? { imageConfig } : {})
      }
    };

    const url = `${GEMINI_API_BASE}/models/${modelId}:generateContent?key=${this.apiKey}`;
    const response = await this._fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Gemini image-to-image failed ${response.status}: ${errText}`
      );
    }

    const data = parseGeminiResponse(await response.json());
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No candidates in response");

    for (const part of parts) {
      if (part.inlineData?.data) {
        return Uint8Array.from(Buffer.from(part.inlineData.data, "base64"));
      }
    }
    throw new Error("No image data returned in response");
  }

  // ---------------------------------------------------------------------------
  // Image batch (async, ~50% off, up to 24h)
  // ---------------------------------------------------------------------------

  private buildGeminiImageBatchRequest(req: {
    prompt: string;
    aspectRatio?: string;
    resolution?: string;
    images?: Uint8Array[];
    mimeType?: string;
  }): Record<string, unknown> {
    const imageConfig: Record<string, unknown> = {};
    if (req.aspectRatio) imageConfig.aspectRatio = req.aspectRatio;
    if (req.resolution) imageConfig.imageSize = req.resolution;
    const parts: Array<Record<string, unknown>> = [{ text: req.prompt }];
    const mimeType = req.mimeType ?? "image/png";
    for (const bytes of req.images ?? []) {
      if (!bytes || bytes.length === 0) continue;
      parts.push({
        inlineData: {
          mimeType,
          data: Buffer.from(bytes).toString("base64")
        }
      });
    }
    return {
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        ...(Object.keys(imageConfig).length > 0 ? { imageConfig } : {})
      }
    };
  }

  /**
   * Submit an async Batch job for Nano Banana / Gemini image models.
   * Uses inline requests when the payload is under 20MB; otherwise uploads JSONL.
   */
  async submitImageBatch(
    params: ImageBatchSubmitParams
  ): Promise<ImageBatchJob> {
    if (!params.requests.length) {
      throw new Error("Image batch requires at least one request");
    }
    const model = params.model || "gemini-3.1-flash-image";
    const inlineRequests = params.requests.map((req, i) => {
      const prompt = req.prompt?.trim();
      if (!prompt) {
        throw new Error(`Image batch request ${i} has an empty prompt`);
      }
      return {
        request: this.buildGeminiImageBatchRequest({
          prompt,
          aspectRatio: req.aspectRatio,
          resolution: req.resolution,
          images: req.images,
          mimeType: req.mimeType
        }),
        metadata: { key: `img-${i}` }
      };
    });

    const bodyBytes = Buffer.byteLength(JSON.stringify(inlineRequests), "utf8");
    const INLINE_LIMIT = 18 * 1024 * 1024; // stay under the 20MB inline cap
    let batchBody: Record<string, unknown>;

    if (bodyBytes <= INLINE_LIMIT) {
      batchBody = {
        batch: {
          display_name: "nodetool-image-batch",
          input_config: {
            requests: { requests: inlineRequests }
          }
        }
      };
    } else {
      const jsonl = params.requests
        .map((req, i) =>
          JSON.stringify({
            key: `img-${i}`,
            request: this.buildGeminiImageBatchRequest({
              prompt: req.prompt.trim(),
              aspectRatio: req.aspectRatio,
              resolution: req.resolution,
              images: req.images,
              mimeType: req.mimeType
            })
          })
        )
        .join("\n");
      const fileName = await this.uploadGeminiBatchJsonl(
        jsonl,
        params.signal
      );
      batchBody = {
        batch: {
          display_name: "nodetool-image-batch",
          input_config: { file_name: fileName }
        }
      };
    }

    const url = `${GEMINI_API_BASE}/models/${model}:batchGenerateContent?key=${this.apiKey}`;
    const response = await this._fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey
      },
      body: JSON.stringify(batchBody),
      signal: params.signal
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Gemini image batch submit failed ${response.status}: ${errText}`
      );
    }
    const data = (await response.json()) as GeminiBatchPayload;
    const batchId = data.name ?? data.batch?.name;
    if (!batchId) {
      throw new Error("Gemini batch create returned no batch name");
    }
    return {
      batchId,
      status: geminiBatchJobStatus(data),
      outputFileId: null,
      error: null
    };
  }

  /**
   * Submit a Gemini image Batch job and poll until completed (or timeout).
   * Returns decoded image bytes. Throws if the job does not complete in time.
   */
  async runImageBatchUntilDone(
    params: ImageBatchSubmitParams
  ): Promise<Uint8Array[]> {
    const timeoutMs = Math.max(0, params.timeoutMs ?? 1_800_000);
    const job = await this.submitImageBatch(params);
    const pending = new Set(["validating", "in_progress"]);
    const start = Date.now();
    let current = job;
    while (pending.has(current.status) && Date.now() - start < timeoutMs) {
      const remaining = timeoutMs - (Date.now() - start);
      if (remaining <= 0) break;
      await new Promise<void>((resolve) =>
        setTimeout(resolve, Math.min(2000, remaining))
      );
      current = await this.getImageBatch({
        batchId: job.batchId,
        signal: params.signal
      });
    }
    if (current.status !== "completed") {
      throw new Error(
        `Image batch '${job.batchId}' did not complete within ` +
          `${Math.round(timeoutMs / 1000)}s (status=${current.status}). ` +
          `Re-run later or check the Gemini Batch dashboard.`
      );
    }
    return this.downloadImageBatchResults({
      batchId: job.batchId,
      model: params.model,
      signal: params.signal
    });
  }

  /** Resumable Files API upload for large batch JSONL inputs. */
  private async uploadGeminiBatchJsonl(
    jsonl: string,
    signal?: AbortSignal
  ): Promise<string> {
    const bytes = Buffer.from(jsonl, "utf8");
    const startUrl = `${GEMINI_API_BASE.replace("/v1beta", "")}/upload/v1beta/files?key=${this.apiKey}`;
    const start = await this._fetch(startUrl, {
      method: "POST",
      headers: {
        "x-goog-api-key": this.apiKey,
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(bytes.length),
        "X-Goog-Upload-Header-Content-Type": "application/jsonl",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        file: { display_name: "nodetool-image-batch.jsonl" }
      }),
      signal
    });
    if (!start.ok) {
      throw new Error(
        `Gemini batch file upload start failed ${start.status}: ${await start.text()}`
      );
    }
    const uploadUrl = start.headers.get("x-goog-upload-url");
    if (!uploadUrl) {
      throw new Error("Gemini batch file upload returned no upload URL");
    }
    const finalize = await this._fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Length": String(bytes.length),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize"
      },
      body: bytes,
      signal
    });
    if (!finalize.ok) {
      throw new Error(
        `Gemini batch file upload failed ${finalize.status}: ${await finalize.text()}`
      );
    }
    const info = (await finalize.json()) as { file?: { name?: string } };
    const name = info.file?.name;
    if (!name) {
      throw new Error("Gemini batch file upload returned no file name");
    }
    return name;
  }

  async getImageBatch(params: ImageBatchGetParams): Promise<ImageBatchJob> {
    const batchId = params.batchId?.trim();
    if (!batchId) {
      throw new Error("batchId is required");
    }
    const url = `${GEMINI_API_BASE}/${batchId}?key=${this.apiKey}`;
    const response = await this._fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey
      },
      signal: params.signal
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Gemini image batch get failed ${response.status}: ${errText}`
      );
    }
    const data = (await response.json()) as GeminiBatchPayload;
    return {
      batchId: data.name ?? data.batch?.name ?? batchId,
      status: geminiBatchJobStatus(data),
      outputFileId: geminiBatchOutputFileId(data),
      error: geminiBatchErrorMessage(data)
    };
  }

  async downloadImageBatchResults(
    params: ImageBatchGetParams & { model?: string }
  ): Promise<Uint8Array[]> {
    const batchId = params.batchId?.trim();
    if (!batchId) {
      throw new Error("batchId is required");
    }
    const url = `${GEMINI_API_BASE}/${batchId}?key=${this.apiKey}`;
    const response = await this._fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey
      },
      signal: params.signal
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Gemini image batch get failed ${response.status}: ${errText}`
      );
    }
    const data = (await response.json()) as GeminiBatchPayload;
    const status = geminiBatchJobStatus(data);
    if (status !== "completed") {
      throw new Error(
        `Image batch '${batchId}' is not completed (status=${status})`
      );
    }

    const images: Uint8Array[] = [];
    let failures = 0;

    for (const row of collectGeminiBatchInlineRows(data)) {
      const rec = recordOf(row);
      if (!rec) {
        failures += 1;
        continue;
      }
      if (rec.error) {
        failures += 1;
        continue;
      }
      const resp = rec.response ?? rec.inlineResponse ?? rec;
      const bytes = extractImageFromGeminiResponse(resp);
      if (bytes) {
        images.push(bytes);
      } else {
        failures += 1;
      }
    }

    const fileName = geminiBatchOutputFileId(data);
    if (images.length === 0 && fileName) {
      const downloadUrl = `https://generativelanguage.googleapis.com/download/v1beta/${fileName}:download?alt=media&key=${this.apiKey}`;
      const fileResp = await this._fetch(downloadUrl, {
        headers: { "x-goog-api-key": this.apiKey },
        signal: params.signal
      });
      if (!fileResp.ok) {
        throw new Error(
          `Gemini batch results download failed ${fileResp.status}: ${await fileResp.text()}`
        );
      }
      const text = await fileResp.text();
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as Record<string, unknown>;
          if (parsed.error) {
            failures += 1;
            continue;
          }
          const bytes = extractImageFromGeminiResponse(
            parsed.response ?? parsed
          );
          if (bytes) {
            images.push(bytes);
          } else {
            failures += 1;
          }
        } catch {
          failures += 1;
        }
      }
    }

    if (failures > 0) {
      log.warn("Gemini image batch had failed or empty result lines", {
        batchId,
        failures,
        images: images.length
      });
    }
    if (images.length === 0) {
      throw new Error(`Image batch '${batchId}' produced no images`);
    }
    this.trackUsage(params.model || "gemini-3.1-flash-image", {
      imageCount: images.length,
      batchDiscount: true
    });
    return images;
  }

  // ---------------------------------------------------------------------------
  // Text-to-speech
  // ---------------------------------------------------------------------------

  override async *textToSpeech(args: {
    text: string;
    model: string;
    voice?: string;
    speed?: number;
    /** Ignored — Gemini returns raw PCM; backend wraps/encodes to honor. */
    audioFormat?: string;
  }): AsyncGenerator<StreamingAudioChunk> {
    const { text, model, voice = "Puck" } = args;

    const body = {
      contents: [{ role: "user" as const, parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }
          }
        }
      }
    };

    const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${this.apiKey}`;
    const response = await this._fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini TTS failed ${response.status}: ${errText}`);
    }

    const data = parseGeminiResponse(await response.json());
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No audio in response");

    for (const part of parts) {
      if (part.inlineData?.data) {
        const raw = Buffer.from(part.inlineData.data, "base64");
        // Gemini TTS returns raw PCM int16 at 24kHz
        const samples = new Int16Array(
          raw.buffer,
          raw.byteOffset,
          raw.byteLength / 2
        );
        yield { samples };
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Automatic speech recognition
  // ---------------------------------------------------------------------------

  override async automaticSpeechRecognition(args: {
    audio: Uint8Array;
    model: string;
    language?: string;
    prompt?: string;
    temperature?: number;
  }): Promise<import("./types.js").ASRResult> {
    const { audio, model, language, temperature = 0 } = args;

    if (!audio || audio.length === 0) {
      throw new Error("audio must not be empty");
    }
    if (audio.length > 20 * 1024 * 1024) {
      throw new Error(
        "Gemini inline audio is limited to 20 MB; upload the audio with the File API first"
      );
    }

    // Detect MIME type from the audio header.
    let mimeType = geminiAudioMime(sniffAudioMime(audio));
    if (
      audio[0] === 0x52 &&
      audio[1] === 0x49 &&
      audio[2] === 0x46 &&
      audio[3] === 0x46
    ) {
      mimeType = "audio/wav";
    } else if (audio[0] === 0x49 && audio[1] === 0x44 && audio[2] === 0x33) {
      mimeType = "audio/mp3";
    } else if (audio[0] === 0xff && (audio[1] === 0xfb || audio[1] === 0xf3)) {
      mimeType = "audio/mp3";
    } else if (
      audio[0] === 0x66 &&
      audio[1] === 0x4c &&
      audio[2] === 0x61 &&
      audio[3] === 0x43
    ) {
      mimeType = "audio/flac";
    } else if (
      audio[0] === 0x4f &&
      audio[1] === 0x67 &&
      audio[2] === 0x67 &&
      audio[3] === 0x53
    ) {
      mimeType = "audio/ogg";
    }

    let promptText = args.prompt ?? "Transcribe this audio to text.";
    if (language) {
      promptText = `${promptText} The audio is in ${language}.`;
    }

    const audioBase64 = Buffer.from(audio).toString("base64");

    const body = {
      contents: [
        {
          role: "user" as const,
          parts: [
            { inlineData: { mimeType, data: audioBase64 } },
            { text: promptText }
          ]
        }
      ],
      generationConfig: {
        temperature
      }
    };

    const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${this.apiKey}`;
    const response = await this._fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini ASR failed ${response.status}: ${errText}`);
    }

    const data = parseGeminiResponse(await response.json());
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) return { text: "" };

    const text = parts
      .filter((p) => p.text !== undefined)
      .map((p) => p.text!)
      .join("");
    return { text };
  }

  private buildVideoParameters(
    params: TextToVideoParams | ImageToVideoParams
  ): Record<string, unknown> {
    const parameters: Record<string, unknown> = {};
    if (params.negativePrompt) {
      parameters.negativePrompt = params.negativePrompt;
    }
    if (params.aspectRatio) {
      parameters.aspectRatio = params.aspectRatio;
    }
    if (params.resolution) {
      parameters.resolution = params.resolution;
    }
    if (params.durationSeconds != null) {
      parameters.durationSeconds = params.durationSeconds;
    }
    if (params.seed != null) {
      parameters.seed = params.seed;
    }
    return parameters;
  }

  private getVideoUri(operation: GeminiVideoOperation): string | undefined {
    return (
      operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video
        ?.uri ?? operation.response?.generatedVideos?.[0]?.video?.uri
    );
  }

  private async waitForVideoOperation(
    operation: GeminiVideoOperation,
    timeoutSeconds?: number | null,
    signal?: AbortSignal
  ): Promise<GeminiVideoOperation> {
    const maxWait =
      timeoutSeconds && timeoutSeconds > 0 ? timeoutSeconds * 1000 : 600_000;
    const pollInterval = 10_000;
    let elapsed = 0;
    let current = operation;

    while (!current.done && elapsed < maxWait) {
      await new Promise<void>((resolve, reject) => {
        const onAbort = (): void => {
          clearTimeout(timer);
          reject(abortError(signal));
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        }, pollInterval);
        signal?.addEventListener("abort", onAbort, { once: true });
      });
      elapsed += pollInterval;

      if (!current.name) {
        throw new Error("No operation name for polling");
      }
      const pollResp = await this._fetch(`${GEMINI_API_BASE}/${current.name}`, {
        headers: { "x-goog-api-key": this.apiKey },
        signal
      });
      if (!pollResp.ok) {
        const errText = await pollResp.text();
        throw new Error(`Poll failed ${pollResp.status}: ${errText}`);
      }
      current = (await pollResp.json()) as GeminiVideoOperation;
    }

    if (!current.done) {
      throw new Error("Video generation timed out");
    }
    if (current.error?.message) {
      throw new Error(
        `Gemini video generation failed: ${current.error.message}`
      );
    }
    return current;
  }

  private async downloadGeminiVideo(
    videoUri: string,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const hostname = new URL(videoUri).hostname;
    const headers =
      hostname === "generativelanguage.googleapis.com"
        ? { "x-goog-api-key": this.apiKey }
        : undefined;
    const response = await safeFetch(
      videoUri,
      { headers, signal },
      5,
      this._fetch
    );
    if (!response.ok) {
      throw new Error(`Video download failed: ${response.status}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  // ---------------------------------------------------------------------------
  // Text-to-video (Veo models — async operation with polling)
  // ---------------------------------------------------------------------------

  override async textToVideo(params: TextToVideoParams): Promise<Uint8Array> {
    if (!params.prompt) {
      throw new Error("The input prompt cannot be empty.");
    }

    const modelId = params.model.id;
    if (!modelId.startsWith("veo-")) {
      throw new Error(
        `Model ${modelId} is not a Veo model. Only Veo models support text-to-video.`
      );
    }

    const body: Record<string, unknown> = {
      instances: [{ prompt: params.prompt }]
    };
    const parameters = this.buildVideoParameters(params);
    if (Object.keys(parameters).length > 0) {
      body.parameters = parameters;
    }

    const signal =
      params.timeoutSeconds && params.timeoutSeconds > 0
        ? AbortSignal.timeout(params.timeoutSeconds * 1000)
        : undefined;
    const response = await this._fetch(
      `${GEMINI_API_BASE}/models/${modelId}:predictLongRunning`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey
        },
        body: JSON.stringify(body),
        signal
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Gemini video generation failed ${response.status}: ${errText}`
      );
    }

    const operation = await this.waitForVideoOperation(
      (await response.json()) as GeminiVideoOperation,
      params.timeoutSeconds,
      signal
    );
    const videoUri = this.getVideoUri(operation);
    if (!videoUri) {
      throw new Error("No video URI in response");
    }
    return this.downloadGeminiVideo(videoUri, signal);
  }

  // ---------------------------------------------------------------------------
  // Image-to-video (Veo models)
  // ---------------------------------------------------------------------------

  override async imageToVideo(
    images: Uint8Array[],
    params: ImageToVideoParams
  ): Promise<Uint8Array> {
    const image = images[0];
    if (!image || image.length === 0) {
      throw new Error("Input image cannot be empty.");
    }

    const modelId = params.model.id;
    if (!modelId.startsWith("veo-")) {
      throw new Error(
        `Model ${modelId} is not a Veo model. Only Veo models support image-to-video.`
      );
    }

    const prompt = params.prompt ?? "Animate this image";
    const body: Record<string, unknown> = {
      instances: [
        {
          prompt,
          image: {
            bytesBase64Encoded: Buffer.from(image).toString("base64"),
            mimeType: "image/png"
          }
        }
      ]
    };
    const parameters = this.buildVideoParameters(params);
    if (Object.keys(parameters).length > 0) {
      body.parameters = parameters;
    }

    const signal =
      params.timeoutSeconds && params.timeoutSeconds > 0
        ? AbortSignal.timeout(params.timeoutSeconds * 1000)
        : undefined;
    const response = await this._fetch(
      `${GEMINI_API_BASE}/models/${modelId}:predictLongRunning`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey
        },
        body: JSON.stringify(body),
        signal
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Gemini image-to-video failed ${response.status}: ${errText}`
      );
    }

    const operation = await this.waitForVideoOperation(
      (await response.json()) as GeminiVideoOperation,
      params.timeoutSeconds,
      signal
    );
    const videoUri = this.getVideoUri(operation);
    if (!videoUri) {
      throw new Error("No video URI in response");
    }
    return this.downloadGeminiVideo(videoUri, signal);
  }

  // ---------------------------------------------------------------------------
  // Error detection
  // ---------------------------------------------------------------------------

  isContextLengthError(error: unknown): boolean {
    const msg = String(error).toLowerCase();
    return (
      msg.includes("context length") ||
      msg.includes("maximum context") ||
      msg.includes("too long") ||
      msg.includes("token limit")
    );
  }
}
