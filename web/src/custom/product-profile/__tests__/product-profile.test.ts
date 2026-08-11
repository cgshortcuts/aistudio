import {
  CUSTOMER_HIDDEN_BOTTOM_PANEL_VIEWS,
  CUSTOMER_HIDDEN_LEFT_PANEL_VIEWS,
  CUSTOMER_HIDDEN_PAGE_KEYS,
  CUSTOMER_HIDDEN_TAB_TYPES,
  CUSTOMER_HIDDEN_TEMPLATE_CATEGORY_IDS,
  CUSTOMER_HIDDEN_TUTORIAL_IDS,
  filterHiddenChatTabs,
  isChatAndAgentsHidden,
  isCustomerVisibleModelProvider,
  isCustomerVisibleProvider,
  visibleCustomerModelProviders,
  isHiddenDefaultModelType,
  isHiddenExampleWorkflow,
  isHiddenHubModelType,
  isHiddenIntegrationSection,
  isHiddenBottomPanelView,
  isHiddenCustomerNodeType,
  isHiddenLeftPanelView,
  isHiddenLocalModel,
  isHiddenPageTab,
  isHiddenTemplateCategory,
  isHiddenTutorial,
  isHiddenWelcomeTrack,
  isHiddenWorkspaceTabType,
  showAgentIntegrations,
  showOptionalNodePacks,
  showSearchProviderSettings,
  visibleBottomPanelViews,
  visibleCustomerNodes,
  visibleExampleWorkflows,
  visibleMediaModes,
  visibleNodeSubcategories,
  visibleTemplateCategories,
  visibleTutorials,
  visibleWelcomeTracks
} from "../index";

describe("isChatAndAgentsHidden", () => {
  it("is off unless hideChatAndAgents is true", () => {
    expect(isChatAndAgentsHidden({})).toBe(false);
    expect(isChatAndAgentsHidden({ hideChatAndAgents: false })).toBe(false);
    expect(isChatAndAgentsHidden({ hideChatAndAgents: true })).toBe(true);
  });
});

describe("filterHiddenChatTabs", () => {
  const tabs = [
    { value: "inspector", label: "Inspector" },
    { value: "agent", label: "Assistant" },
    { value: "assistant", label: "Assistant" },
    { value: "history", label: "History" }
  ];

  it("keeps every tab when chat is visible", () => {
    expect(filterHiddenChatTabs(tabs, false)).toEqual(tabs);
  });

  it("drops agent and assistant tabs when chat is hidden", () => {
    expect(filterHiddenChatTabs(tabs, true).map((t) => t.value)).toEqual([
      "inspector",
      "history"
    ]);
  });
});

describe("visibleNodeSubcategories", () => {
  it("keeps the Agents subcategory in full mode", () => {
    expect(visibleNodeSubcategories(false).some((s) => s.id === "agents")).toBe(
      true
    );
  });

  it("drops the Agents subcategory in customer mode", () => {
    expect(visibleNodeSubcategories(true).some((s) => s.id === "agents")).toBe(
      false
    );
  });
});

describe("customer node menu", () => {
  it("hides chat, code, search, and browser nodes", () => {
    expect(isHiddenCustomerNodeType("openai.text.Embedding", true)).toBe(true);
    expect(isHiddenCustomerNodeType("gemini.text.Embedding", true)).toBe(true);
    expect(isHiddenCustomerNodeType("nodetool.code.Code", true)).toBe(true);
    expect(isHiddenCustomerNodeType("nodetool.sandbox.SandboxShell", true)).toBe(
      true
    );
    expect(isHiddenCustomerNodeType("search.google.GoogleSearch", true)).toBe(
      true
    );
    expect(isHiddenCustomerNodeType("lib.browser.Browser", true)).toBe(true);
    expect(isHiddenCustomerNodeType("huggingface.ChatCompletion", true)).toBe(
      true
    );
  });

  it("keeps FAL and OpenAI/Gemini image, video, and audio nodes", () => {
    expect(isHiddenCustomerNodeType("fal.image.TextToImage", true)).toBe(false);
    expect(isHiddenCustomerNodeType("openai.image.CreateImage", true)).toBe(
      false
    );
    expect(isHiddenCustomerNodeType("gemini.image.ImageGeneration", true)).toBe(
      false
    );
    expect(isHiddenCustomerNodeType("gemini.video.TextToVideo", true)).toBe(
      false
    );
    expect(isHiddenCustomerNodeType("openai.audio.TextToSpeech", true)).toBe(
      false
    );
    expect(isHiddenCustomerNodeType("huggingface.TextToImage", true)).toBe(
      false
    );
    expect(isHiddenCustomerNodeType("nodetool.image.LoadImage", true)).toBe(
      false
    );
    expect(isHiddenCustomerNodeType("nodetool.text.Split", true)).toBe(false);
  });

  it("drops hidden nodes from browse lists and hides optional packs", () => {
    const visible = visibleCustomerNodes(
      [
        { node_type: "fal.image.TextToImage" },
        { node_type: "openai.text.Embedding" },
        { node_type: "nodetool.code.Code" }
      ],
      true
    ).map((node) => node.node_type);
    expect(visible).toEqual(["fal.image.TextToImage"]);
    expect(showOptionalNodePacks(true)).toBe(false);
    expect(showOptionalNodePacks(false)).toBe(true);
  });
});

describe("CUSTOMER_HIDDEN_LEFT_PANEL_VIEWS", () => {
  it("hides chats, storyboards, and scripts from the left rail", () => {
    expect(CUSTOMER_HIDDEN_LEFT_PANEL_VIEWS).toEqual([
      "chats",
      "storyboards",
      "scripts"
    ]);
  });
});

describe("customer hidden surfaces", () => {
  it("hides dashboard, tutorials, collections, workspaces, and package manager", () => {
    expect([...CUSTOMER_HIDDEN_PAGE_KEYS]).toEqual([
      "dashboard",
      "tutorials",
      "collections",
      "workspaces",
      "packages"
    ]);
    expect(isHiddenPageTab("dashboard", true)).toBe(true);
    expect(isHiddenPageTab("tutorials", true)).toBe(true);
    expect(isHiddenPageTab("collections", true)).toBe(true);
    expect(isHiddenPageTab("workspaces", true)).toBe(true);
    expect(isHiddenPageTab("packages", true)).toBe(true);
    expect(isHiddenPageTab("models", true)).toBe(false);
    expect(isHiddenPageTab("settings", true)).toBe(false);
    expect(isHiddenPageTab("examples", true)).toBe(false);
    expect(isHiddenPageTab("collections", false)).toBe(false);
  });

  it("hides chat, storyboard, and script workspace tabs", () => {
    expect([...CUSTOMER_HIDDEN_TAB_TYPES]).toEqual([
      "chat",
      "storyboard",
      "script"
    ]);
    expect(isHiddenWorkspaceTabType("storyboard", true)).toBe(true);
    expect(isHiddenWorkspaceTabType("script", true)).toBe(true);
    expect(isHiddenWorkspaceTabType("timeline", true)).toBe(false);
    expect(isHiddenWorkspaceTabType("storyboard", false)).toBe(false);
  });

  it("matches left-rail views against the hidden list", () => {
    expect(isHiddenLeftPanelView("scripts", true)).toBe(true);
    expect(isHiddenLeftPanelView("workflows", true)).toBe(false);
  });

  it("hides sandboxes, workers, versions, workspace, and trace from the bottom bar", () => {
    expect([...CUSTOMER_HIDDEN_BOTTOM_PANEL_VIEWS]).toEqual([
      "sandboxes",
      "workers",
      "versions",
      "workspace",
      "trace"
    ]);
    expect(isHiddenBottomPanelView("sandboxes", true)).toBe(true);
    expect(isHiddenBottomPanelView("workers", true)).toBe(true);
    expect(isHiddenBottomPanelView("versions", true)).toBe(true);
    expect(isHiddenBottomPanelView("workspace", true)).toBe(true);
    expect(isHiddenBottomPanelView("trace", true)).toBe(true);
    expect(isHiddenBottomPanelView("queue", true)).toBe(false);
    expect(isHiddenBottomPanelView("logs", true)).toBe(false);
    expect(isHiddenBottomPanelView("trace", false)).toBe(false);
    expect(
      visibleBottomPanelViews(
        ["logs", "queue", "sandboxes", "workers", "versions", "workspace", "trace"],
        true
      )
    ).toEqual(["logs", "queue"]);
  });
});

describe("customer provider and settings filters", () => {
  it("keeps OpenAI, Gemini, HuggingFace, and every media provider", () => {
    expect(
      isCustomerVisibleProvider({ key: "OPENAI_API_KEY", section: "popular" }, true)
    ).toBe(true);
    expect(
      isCustomerVisibleProvider({ key: "GEMINI_API_KEY", section: "popular" }, true)
    ).toBe(true);
    expect(
      isCustomerVisibleProvider({ key: "HF_TOKEN", section: "language" }, true)
    ).toBe(true);
    expect(
      isCustomerVisibleProvider({ key: "FAL_API_KEY", section: "media" }, true)
    ).toBe(true);
    expect(
      isCustomerVisibleProvider(
        { key: "BYTEPLUS_API_KEY", section: "media" },
        true
      )
    ).toBe(true);
  });

  it("hides Claude, chat LLMs, search, and compute providers", () => {
    expect(
      isCustomerVisibleProvider(
        { key: "CLAUDE_SUBSCRIPTION", section: "popular" },
        true
      )
    ).toBe(false);
    expect(
      isCustomerVisibleProvider(
        { key: "ANTHROPIC_API_KEY", section: "popular" },
        true
      )
    ).toBe(false);
    expect(
      isCustomerVisibleProvider({ key: "GROQ_API_KEY", section: "language" }, true)
    ).toBe(false);
    expect(
      isCustomerVisibleProvider({ key: "SERPAPI_API_KEY", section: "search" }, true)
    ).toBe(false);
    expect(
      isCustomerVisibleProvider(
        { key: "OPENAI_API_KEY", section: "popular" },
        false
      )
    ).toBe(true);
  });

  it("keeps media model providers and drops chat / local LLM backends", () => {
    expect(isCustomerVisibleModelProvider("fal_ai", true)).toBe(true);
    expect(isCustomerVisibleModelProvider("fal", true)).toBe(true);
    expect(isCustomerVisibleModelProvider("openai", true)).toBe(true);
    expect(isCustomerVisibleModelProvider("gemini", true)).toBe(true);
    expect(isCustomerVisibleModelProvider("huggingface", true)).toBe(true);
    expect(isCustomerVisibleModelProvider("hf_hub", true)).toBe(true);
    expect(isCustomerVisibleModelProvider("kie", true)).toBe(true);
    expect(isCustomerVisibleModelProvider("byteplus", true)).toBe(true);
    expect(isCustomerVisibleModelProvider("replicate", true)).toBe(true);
    expect(isCustomerVisibleModelProvider("elevenlabs", true)).toBe(true);
    expect(isCustomerVisibleModelProvider("minimax", true)).toBe(true);

    expect(isCustomerVisibleModelProvider("codex", true)).toBe(false);
    expect(isCustomerVisibleModelProvider("lmstudio", true)).toBe(false);
    expect(isCustomerVisibleModelProvider("ollama", true)).toBe(false);
    expect(isCustomerVisibleModelProvider("llama_cpp", true)).toBe(false);
    expect(isCustomerVisibleModelProvider("vllm", true)).toBe(false);
    expect(isCustomerVisibleModelProvider("anthropic", true)).toBe(false);
    expect(isCustomerVisibleModelProvider("claude_agent_sdk", true)).toBe(false);
    expect(isCustomerVisibleModelProvider("groq", true)).toBe(false);
    expect(isCustomerVisibleModelProvider("openrouter", true)).toBe(false);
    expect(isCustomerVisibleModelProvider("mistral", true)).toBe(false);

    expect(isCustomerVisibleModelProvider("codex", false)).toBe(true);
    expect(
      visibleCustomerModelProviders(
        [
          { provider: "fal_ai" },
          { provider: "codex" },
          { provider: "lmstudio" },
          { provider: "openai" }
        ],
        true
      ).map((item) => item.provider)
    ).toEqual(["fal_ai", "openai"]);
  });

  it("hides language, embedding, and code default-model rows", () => {
    expect(isHiddenDefaultModelType("language_model", true)).toBe(true);
    expect(isHiddenDefaultModelType("embedding_model", true)).toBe(true);
    expect(isHiddenDefaultModelType("code_model", true)).toBe(true);
    expect(isHiddenDefaultModelType("image_model", true)).toBe(false);
    expect(isHiddenDefaultModelType("video_model", true)).toBe(false);
  });

  it("hides local LLM servers, search, MCP, and browser extension", () => {
    expect(isHiddenIntegrationSection("local-model-servers", true)).toBe(true);
    expect(isHiddenIntegrationSection("observability", true)).toBe(false);
    expect(showSearchProviderSettings(true)).toBe(false);
    expect(showAgentIntegrations(true)).toBe(false);
    expect(showAgentIntegrations(false)).toBe(true);
  });

  it("hides chat Hub categories and Ollama, keeps image and video", () => {
    expect(isHiddenHubModelType("hf.text_generation", true)).toBe(true);
    expect(isHiddenHubModelType("llama_model", true)).toBe(true);
    expect(isHiddenHubModelType("hf.text_to_image", true)).toBe(false);
    expect(isHiddenHubModelType("hf.text_to_video", true)).toBe(false);
    expect(isHiddenLocalModel({ type: "llama_model", provider: "ollama" }, true)).toBe(
      true
    );
    expect(
      isHiddenLocalModel({ type: "hf.text_to_image", provider: "huggingface" }, true)
    ).toBe(false);
  });
});

describe("customer example templates", () => {
  const examples = [
    { id: "audio-to-image", name: "Audio To Image", tags: ["multimodal", "huggingface"] },
    { id: "movie_trailer_generator", name: "Movie Trailer Generator", tags: ["video", "ai"] },
    { id: "ai-launch", name: "AI Product Launch Video Generator", tags: ["business", "data", "video"] },
    { id: "data_generator", name: "Data Generator", tags: ["agents"] },
    { id: "agent-google-search-example", name: "Agent Google Search", tags: ["agent", "google", "search"] },
    {
      id: "830163fea2fc11f0b02700001a475e0e",
      name: "Image To Audio Story",
      tags: ["start", "multimodal"]
    },
    { id: "wiki", name: "Wikipedia Agent", tags: ["wikipedia", "research"] },
    { id: "transcribe", name: "Transcribe Audio", tags: ["start", "audio", "huggingface"] }
  ];

  it("hides Agents and Data & Web pills, keeps Multimodal", () => {
    expect([...CUSTOMER_HIDDEN_TEMPLATE_CATEGORY_IDS]).toEqual([
      "agents",
      "data-web"
    ]);
    expect(isHiddenTemplateCategory("agents", true)).toBe(true);
    expect(isHiddenTemplateCategory("data-web", true)).toBe(true);
    expect(isHiddenTemplateCategory("multimodal", true)).toBe(false);
    expect(
      visibleTemplateCategories(
        [{ id: "image" }, { id: "multimodal" }, { id: "agents" }, { id: "data-web" }],
        true
      ).map((c) => c.id)
    ).toEqual(["image", "multimodal"]);
  });

  it("drops agent and data-web examples from All, keeps generation templates", () => {
    const visible = visibleExampleWorkflows(examples, true).map((e) => e.name);
    expect(visible).toEqual([
      "Audio To Image",
      "Movie Trailer Generator",
      "AI Product Launch Video Generator",
      "Transcribe Audio"
    ]);
    expect(isHiddenExampleWorkflow(examples[3], false)).toBe(false);
  });

  it("hides the Text · Agent welcome card and chat/agent tutorials", () => {
    expect(isHiddenWelcomeTrack("agent", true)).toBe(true);
    expect(isHiddenWelcomeTrack("image", true)).toBe(false);
    expect(
      visibleWelcomeTracks(
        [{ id: "image" }, { id: "video" }, { id: "audio" }, { id: "agent" }],
        true
      ).map((t) => t.id)
    ).toEqual(["image", "video", "audio"]);
    expect([...CUSTOMER_HIDDEN_TUTORIAL_IDS]).toEqual([
      "describe-image",
      "chat-agent-qa"
    ]);
    expect(isHiddenTutorial("describe-image", true)).toBe(true);
    expect(isHiddenTutorial("first-workflow", true)).toBe(false);
    expect(
      visibleTutorials(
        [
          { id: "first-workflow" },
          { id: "describe-image" },
          { id: "chat-agent-qa" },
          { id: "timeline-trim-arrange" }
        ],
        true
      ).map((t) => t.id)
    ).toEqual(["first-workflow", "timeline-trim-arrange"]);
  });
});

describe("visibleMediaModes", () => {
  const modes = [{ id: "chat" }, { id: "image" }, { id: "video" }];

  it("keeps Chat in full mode", () => {
    expect(visibleMediaModes(modes, false).map((m) => m.id)).toEqual([
      "chat",
      "image",
      "video"
    ]);
  });

  it("drops Chat in customer mode", () => {
    expect(visibleMediaModes(modes, true).map((m) => m.id)).toEqual([
      "image",
      "video"
    ]);
  });
});
