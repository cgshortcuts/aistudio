/**
 * AiStudio customer product profile (fork).
 *
 * The backend publishes `hideChatAndAgents` on GET /api/config when
 * `AISTUDIO_PRODUCT=customer`. UI call sites read that flag and hide chat,
 * agents, dashboard, tutorials, collections, workspaces, storyboards,
 * scripts, chat-adjacent settings, and agent/data-web example templates.
 * Image/video generation
 * stays (FAL, OpenAI/Gemini image, local image/video models). Local
 * `npm run dev` stays full unless the env is set.
 */
import { getRuntimeConfig } from "../../lib/runtimeConfig";
import {
  NODE_SUBCATEGORIES,
  type NodeSubcategory
} from "../../config/quickAccessCategories";
import type { LeftPanelView } from "../../stores/PanelStore";

export const CUSTOMER_HIDDEN_LEFT_PANEL_VIEWS: readonly LeftPanelView[] = [
  "chats",
  "storyboards",
  "scripts"
];

/** Bottom-bar tools dropped in customer mode. Queue and Logs stay. */
export const CUSTOMER_HIDDEN_BOTTOM_PANEL_VIEWS = [
  "sandboxes",
  "workers",
  "versions",
  "workspace",
  "trace"
] as const;

export const CUSTOMER_HIDDEN_PAGE_KEYS = [
  "dashboard",
  "tutorials",
  "collections",
  "workspaces",
  "packages"
] as const;

/** Providers kept in customer mode besides every `media` card. */
export const CUSTOMER_VISIBLE_PROVIDER_KEYS = [
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "HF_TOKEN"
] as const;

/**
 * Model-menu provider ids kept in customer mode. Chat/local LLM backends
 * (Codex, LM Studio, Ollama, Groq, Anthropic, OpenRouter, …) are omitted.
 * `fal` / `fal_ai` and HuggingFace Hub prefixes are matched separately.
 */
export const CUSTOMER_VISIBLE_MODEL_PROVIDERS = [
  "openai",
  "gemini",
  "google",
  "huggingface",
  "fal",
  "fal_ai",
  "kie",
  "byteplus",
  "replicate",
  "elevenlabs",
  "topaz",
  "reve",
  "meshy",
  "rodin",
  "minimax"
] as const;

export const CUSTOMER_HIDDEN_DEFAULT_MODEL_TYPES = [
  "language_model",
  "embedding_model",
  "code_model"
] as const;

export const CUSTOMER_HIDDEN_INTEGRATION_SECTION_KEYS = [
  "local-model-servers"
] as const;

/** HuggingFace Hub pipeline tags that are chat / LLM, not image or video. */
export const CUSTOMER_HIDDEN_HUB_PIPELINE_TAGS = [
  "text-generation",
  "text-classification",
  "text2text-generation",
  "fill-mask",
  "token-classification",
  "question-answering",
  "zero-shot-classification",
  "translation",
  "summarization",
  "feature-extraction",
  "sentence-similarity",
  "image-text-to-text",
  "visual-question-answering",
  "document-question-answering",
  "audio-text-to-text",
  "video-text-to-text",
  "any-to-any"
] as const;

export const CUSTOMER_HIDDEN_TAB_TYPES = [
  "chat",
  "storyboard",
  "script"
] as const;

/** Example gallery pills dropped in customer mode. */
export const CUSTOMER_HIDDEN_TEMPLATE_CATEGORY_IDS = [
  "agents",
  "data-web"
] as const;

/**
 * Tags that put an example in Agents or Data & Web. `huggingface`, `ai`,
 * and `data` are omitted — those also sit on image/video templates.
 */
export const CUSTOMER_HIDDEN_TEMPLATE_TAGS = [
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

export const CUSTOMER_HIDDEN_TEMPLATE_NAMES = [
  "image to audio story"
] as const;

export const CUSTOMER_HIDDEN_TEMPLATE_IDS = [
  "830163fea2fc11f0b02700001a475e0e",
  "agent-google-search-example",
  "youtube-research-claude-agent",
  "data_generator"
] as const;

export const CUSTOMER_HIDDEN_WELCOME_TRACK_IDS = ["agent"] as const;

export const CUSTOMER_HIDDEN_TUTORIAL_IDS = [
  "describe-image",
  "chat-agent-qa"
] as const;

/** Node-type prefixes dropped from the customer node menu and registry. */
export const CUSTOMER_HIDDEN_NODE_PREFIXES = [
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

export const CUSTOMER_HIDDEN_NODE_TYPES = [
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

const HIDDEN_TEMPLATE_NAME_PATTERN = /\bagent\b/i;

export function isChatAndAgentsHidden(
  config: { hideChatAndAgents?: boolean } = getRuntimeConfig()
): boolean {
  return config.hideChatAndAgents === true;
}

export function isHiddenLeftPanelView(
  view: string,
  hidden = isChatAndAgentsHidden()
): boolean {
  return (
    hidden &&
    (CUSTOMER_HIDDEN_LEFT_PANEL_VIEWS as readonly string[]).includes(view)
  );
}

export function isHiddenBottomPanelView(
  view: string,
  hidden = isChatAndAgentsHidden()
): boolean {
  return (
    hidden &&
    (CUSTOMER_HIDDEN_BOTTOM_PANEL_VIEWS as readonly string[]).includes(view)
  );
}

export function visibleBottomPanelViews<T extends string>(
  views: readonly T[],
  hidden = isChatAndAgentsHidden()
): T[] {
  if (!hidden) {
    return [...views];
  }
  return views.filter((view) => !isHiddenBottomPanelView(view, hidden));
}

export function isHiddenPageTab(
  key: string,
  hidden = isChatAndAgentsHidden()
): boolean {
  return (
    hidden && (CUSTOMER_HIDDEN_PAGE_KEYS as readonly string[]).includes(key)
  );
}

export function isHiddenWorkspaceTabType(
  type: string,
  hidden = isChatAndAgentsHidden()
): boolean {
  return (
    hidden && (CUSTOMER_HIDDEN_TAB_TYPES as readonly string[]).includes(type)
  );
}

export function isCustomerVisibleProvider(
  meta: { key: string; section: string },
  hidden = isChatAndAgentsHidden()
): boolean {
  if (!hidden) {
    return true;
  }
  if (meta.section === "media") {
    return true;
  }
  return (CUSTOMER_VISIBLE_PROVIDER_KEYS as readonly string[]).includes(
    meta.key
  );
}

export function isCustomerVisibleModelProvider(
  provider: string,
  hidden = isChatAndAgentsHidden()
): boolean {
  if (!hidden) {
    return true;
  }
  const normalized = provider.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (
    (CUSTOMER_VISIBLE_MODEL_PROVIDERS as readonly string[]).includes(
      normalized
    )
  ) {
    return true;
  }
  if (normalized.startsWith("hf_")) {
    return true;
  }
  return normalized.includes("fal");
}

export function visibleCustomerModelProviders<T extends { provider: string }>(
  providers: readonly T[],
  hidden = isChatAndAgentsHidden()
): T[] {
  if (!hidden) {
    return [...providers];
  }
  return providers.filter((item) =>
    isCustomerVisibleModelProvider(item.provider, hidden)
  );
}

export function isHiddenDefaultModelType(
  type: string,
  hidden = isChatAndAgentsHidden()
): boolean {
  return (
    hidden &&
    (CUSTOMER_HIDDEN_DEFAULT_MODEL_TYPES as readonly string[]).includes(type)
  );
}

export function isHiddenIntegrationSection(
  key: string,
  hidden = isChatAndAgentsHidden()
): boolean {
  return (
    hidden &&
    (CUSTOMER_HIDDEN_INTEGRATION_SECTION_KEYS as readonly string[]).includes(
      key
    )
  );
}

export function showSearchProviderSettings(
  hidden = isChatAndAgentsHidden()
): boolean {
  return !hidden;
}

export function showAgentIntegrations(
  hidden = isChatAndAgentsHidden()
): boolean {
  return !hidden;
}

function hubPipelineTagFromModelType(type: string): string {
  return type.replace(/^(hf|tjs)\./, "").replace(/_/g, "-");
}

export function isHiddenHubModelType(
  type: string,
  hidden = isChatAndAgentsHidden()
): boolean {
  if (!hidden || type === "All") {
    return false;
  }
  if (type === "llama_model") {
    return true;
  }
  return (CUSTOMER_HIDDEN_HUB_PIPELINE_TAGS as readonly string[]).includes(
    hubPipelineTagFromModelType(type)
  );
}

export function isHiddenLocalModel(
  model: { type?: string | null; provider?: string | null },
  hidden = isChatAndAgentsHidden()
): boolean {
  if (!hidden) {
    return false;
  }
  const provider = model.provider ?? "";
  if (provider === "ollama") {
    return true;
  }
  return isHiddenHubModelType(model.type ?? "", hidden);
}

/** Drop Assistant / Agent tabs when the customer product is on. */
export function filterHiddenChatTabs<T extends { value: string }>(
  tabs: readonly T[],
  hidden = isChatAndAgentsHidden()
): T[] {
  if (!hidden) {
    return [...tabs];
  }
  return tabs.filter(
    (tab) => tab.value !== "agent" && tab.value !== "assistant"
  );
}

export function visibleNodeSubcategories(
  hidden = isChatAndAgentsHidden()
): readonly NodeSubcategory[] {
  if (!hidden) {
    return NODE_SUBCATEGORIES;
  }
  return NODE_SUBCATEGORIES.filter((sub) => sub.id !== "agents");
}

export function isHiddenCustomerNodeType(
  nodeType: string | null | undefined,
  hidden = isChatAndAgentsHidden()
): boolean {
  if (!hidden || !nodeType) {
    return false;
  }
  if ((CUSTOMER_HIDDEN_NODE_TYPES as readonly string[]).includes(nodeType)) {
    return true;
  }
  return (CUSTOMER_HIDDEN_NODE_PREFIXES as readonly string[]).some((prefix) =>
    nodeType.startsWith(prefix)
  );
}

export function visibleCustomerNodes<T extends { node_type: string }>(
  nodes: readonly T[],
  hidden = isChatAndAgentsHidden()
): T[] {
  if (!hidden) {
    return [...nodes];
  }
  return nodes.filter(
    (node) => !isHiddenCustomerNodeType(node.node_type, hidden)
  );
}

export function showOptionalNodePacks(
  hidden = isChatAndAgentsHidden()
): boolean {
  return !hidden;
}

/** Drop Chat from the canvas Mode menu. Agent/Pi is gated separately. */
export function visibleMediaModes<T extends { id: string }>(
  modes: readonly T[],
  hidden = isChatAndAgentsHidden()
): T[] {
  if (!hidden) {
    return [...modes];
  }
  return modes.filter((mode) => mode.id !== "chat");
}

export function isHiddenTemplateCategory(
  id: string,
  hidden = isChatAndAgentsHidden()
): boolean {
  return (
    hidden &&
    (CUSTOMER_HIDDEN_TEMPLATE_CATEGORY_IDS as readonly string[]).includes(id)
  );
}

export function visibleTemplateCategories<T extends { id: string }>(
  categories: readonly T[],
  hidden = isChatAndAgentsHidden()
): T[] {
  if (!hidden) {
    return [...categories];
  }
  return categories.filter(
    (category) => !isHiddenTemplateCategory(category.id, hidden)
  );
}

export function isHiddenExampleWorkflow(
  workflow: { id?: string | null; name?: string | null; tags?: string[] | null },
  hidden = isChatAndAgentsHidden()
): boolean {
  if (!hidden) {
    return false;
  }
  const id = (workflow.id ?? "").trim().toLowerCase();
  if ((CUSTOMER_HIDDEN_TEMPLATE_IDS as readonly string[]).includes(id)) {
    return true;
  }
  const name = (workflow.name ?? "").trim();
  if (
    (CUSTOMER_HIDDEN_TEMPLATE_NAMES as readonly string[]).includes(
      name.toLowerCase()
    ) ||
    HIDDEN_TEMPLATE_NAME_PATTERN.test(name)
  ) {
    return true;
  }
  const tags = workflow.tags ?? [];
  return tags.some((tag) =>
    (CUSTOMER_HIDDEN_TEMPLATE_TAGS as readonly string[]).includes(
      tag.toLowerCase()
    )
  );
}

export function visibleExampleWorkflows<T extends {
  id?: string | null;
  name?: string | null;
  tags?: string[] | null;
}>(
  workflows: readonly T[],
  hidden = isChatAndAgentsHidden()
): T[] {
  if (!hidden) {
    return [...workflows];
  }
  return workflows.filter((workflow) => !isHiddenExampleWorkflow(workflow, hidden));
}

export function isHiddenWelcomeTrack(
  id: string,
  hidden = isChatAndAgentsHidden()
): boolean {
  return (
    hidden &&
    (CUSTOMER_HIDDEN_WELCOME_TRACK_IDS as readonly string[]).includes(id)
  );
}

export function visibleWelcomeTracks<T extends { id: string }>(
  tracks: readonly T[],
  hidden = isChatAndAgentsHidden()
): T[] {
  if (!hidden) {
    return [...tracks];
  }
  return tracks.filter((track) => !isHiddenWelcomeTrack(track.id, hidden));
}

export function isHiddenTutorial(
  id: string,
  hidden = isChatAndAgentsHidden()
): boolean {
  return (
    hidden && (CUSTOMER_HIDDEN_TUTORIAL_IDS as readonly string[]).includes(id)
  );
}

export function visibleTutorials<T extends { id: string }>(
  tutorials: readonly T[],
  hidden = isChatAndAgentsHidden()
): T[] {
  if (!hidden) {
    return [...tutorials];
  }
  return tutorials.filter((tutorial) => !isHiddenTutorial(tutorial.id, hidden));
}
