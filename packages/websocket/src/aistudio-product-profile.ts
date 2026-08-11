/**
 * AiStudio customer product profile (fork).
 *
 * Packaged desktop defaults to `AISTUDIO_PRODUCT=customer`: agent, script,
 * workspace, and vector/collection node namespaces are unregistered, the
 * web client hides those surfaces, and agent/data-web example graphs are
 * omitted from the catalog. Local `npm run dev` stays full unless the env
 * is set. Flip to `full` to restore everything — packages and example files
 * are not deleted.
 */

import type { NodeRegistry } from "@nodetool-ai/node-sdk";

export const AISTUDIO_PRODUCT_ENV = "AISTUDIO_PRODUCT";

/** Node-type prefixes hidden in the customer product. */
export const AISTUDIO_HIDDEN_NODE_PREFIXES = [
  "nodetool.agents.",
  "openai.agents.",
  "nodetool.script.",
  "nodetool.workspace.",
  "vector.",
  "openai.text.",
  "gemini.text.",
  "mistral.",
  "xai.text.",
  "xai.vision.",
  "anthropic.",
  "groq.",
  "ollama.",
  "nodetool.code.",
  "nodetool.sandbox.",
  "nodetool.generators.",
  "nodetool.creative.",
  "search.",
  "apify.",
  "messaging.",
  "lib.browser.",
  "lib.os.",
  "lib.rss."
] as const;

/** HuggingFace chat / NLP nodes. Image, video, and ASR stay. */
export const AISTUDIO_HIDDEN_NODE_TYPES = [
  "huggingface.ChatCompletion",
  "huggingface.TextGeneration",
  "huggingface.Summarization",
  "huggingface.Translation",
  "huggingface.FillMask",
  "huggingface.QuestionAnswering",
  "huggingface.TableQuestionAnswering",
  "huggingface.FeatureExtraction",
  "huggingface.TextClassification",
  "huggingface.TokenClassification",
  "huggingface.ZeroShotClassification"
] as const;

export function isAiStudioCustomerProduct(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env[AISTUDIO_PRODUCT_ENV]?.trim() === "customer";
}

export function isAiStudioHiddenNodeType(nodeType: string): boolean {
  if ((AISTUDIO_HIDDEN_NODE_TYPES as readonly string[]).includes(nodeType)) {
    return true;
  }
  return AISTUDIO_HIDDEN_NODE_PREFIXES.some((prefix) =>
    nodeType.startsWith(prefix)
  );
}

/**
 * Gallery tags that put an example in Agents or Data & Web. `huggingface`,
 * `ai`, and `data` are omitted — those also sit on image/video templates.
 */
export const AISTUDIO_HIDDEN_EXAMPLE_TAGS = [
  "agent",
  "agents",
  "claude",
  "search",
  "serp",
  "rag",
  "research",
  "news",
  "analysis",
  "web",
  "google",
  "reddit",
  "amazon",
  "trends"
] as const;

/** Display names hidden even when tagged multimodal / start. */
export const AISTUDIO_HIDDEN_EXAMPLE_NAMES = [
  "image to audio story"
] as const;

export const AISTUDIO_HIDDEN_EXAMPLE_IDS = [
  "830163fea2fc11f0b02700001a475e0e",
  "agent-google-search-example",
  "youtube-research-claude-agent",
  "data_generator"
] as const;

const HIDDEN_EXAMPLE_NAME_PATTERN = /\bagent\b/i;

export interface AiStudioExampleRef {
  id?: string | null;
  name?: string | null;
  tags?: string[] | null;
  graph?: unknown;
}

function exampleGraphUsesHiddenNodes(graph: unknown): boolean {
  if (!graph || typeof graph !== "object") {
    return false;
  }
  const nodes = (graph as { nodes?: unknown }).nodes;
  if (!Array.isArray(nodes)) {
    return false;
  }
  for (const node of nodes) {
    if (!node || typeof node !== "object") {
      continue;
    }
    const record = node as Record<string, unknown>;
    const direct = record.type;
    if (typeof direct === "string" && isAiStudioHiddenNodeType(direct)) {
      return true;
    }
    const data = record.data;
    if (data && typeof data === "object") {
      const nested = (data as Record<string, unknown>).type;
      if (typeof nested === "string" && isAiStudioHiddenNodeType(nested)) {
        return true;
      }
    }
  }
  return false;
}

/** True when a customer install must not list or open this example. */
export function isAiStudioHiddenExample(
  example: AiStudioExampleRef,
  customer = isAiStudioCustomerProduct()
): boolean {
  if (!customer) {
    return false;
  }
  const id = (example.id ?? "").trim().toLowerCase();
  if ((AISTUDIO_HIDDEN_EXAMPLE_IDS as readonly string[]).includes(id)) {
    return true;
  }
  const name = (example.name ?? "").trim();
  if (
    (AISTUDIO_HIDDEN_EXAMPLE_NAMES as readonly string[]).includes(
      name.toLowerCase()
    ) ||
    HIDDEN_EXAMPLE_NAME_PATTERN.test(name)
  ) {
    return true;
  }
  const tags = example.tags ?? [];
  if (
    tags.some((tag) =>
      (AISTUDIO_HIDDEN_EXAMPLE_TAGS as readonly string[]).includes(
        tag.toLowerCase()
      )
    )
  ) {
    return true;
  }
  return exampleGraphUsesHiddenNodes(example.graph);
}

/** Inspect a raw example JSON object (list + load paths). */
export function isAiStudioHiddenExampleRecord(
  parsed: Record<string, unknown>,
  fallback: { id?: string; name?: string } = {},
  customer = isAiStudioCustomerProduct()
): boolean {
  const name =
    typeof parsed.name === "string" ? parsed.name : (fallback.name ?? "");
  const id =
    typeof parsed.id === "string" && parsed.id.length > 0
      ? parsed.id
      : (fallback.id ?? "");
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  return isAiStudioHiddenExample(
    { id, name, tags, graph: parsed.graph },
    customer
  );
}

/**
 * Unregister customer-hidden node types. A no-op otherwise, so OSS/local
 * full installs are unchanged.
 */
export function applyAiStudioNodePolicy(
  registry: NodeRegistry,
  log?: { info: (msg: string) => void }
): void {
  if (!isAiStudioCustomerProduct()) {
    return;
  }
  for (const nodeType of registry.list()) {
    if (isAiStudioHiddenNodeType(nodeType) && registry.unregister(nodeType)) {
      log?.info(`AiStudio customer profile: dropped ${nodeType}`);
    }
  }
}
