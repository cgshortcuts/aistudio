export type ExampleThumbnailKind =
  | "imageGenerate"
  | "imageEdit"
  | "imageFill"
  | "imageErase"
  | "imageUpscale"
  | "imageCutout"
  | "imageSticker"
  | "imageRelight"
  | "imageCrop"
  | "imageFilter"
  | "imageDraw"
  | "videoGenerate"
  | "videoAnimate"
  | "videoReference"
  | "videoMotion"
  | "videoExtend"
  | "videoUpscale"
  | "video3d"
  | "videoEdit"
  | "videoColor"
  | "model3d"
  | "texture"
  | "material"
  | "audioMusic"
  | "audioSfx"
  | "audioVoice"
  | "audioFoley"
  | "audioEdit"
  | "text"
  | "summarize"
  | "translate"
  | "chat"
  | "agent"
  | "data"
  | "code"
  | "search"
  | "web"
  | "schedule"
  | "document"
  | "list"
  | "sparkles";

const NAME_RULES: ReadonlyArray<{
  kind: ExampleThumbnailKind;
  needles: readonly string[];
}> = [
  { kind: "imageFill", needles: ["image fill"] },
  { kind: "imageErase", needles: ["image erase"] },
  {
    kind: "imageCutout",
    needles: [
      "background removal",
      "cut out the subject",
      "cut a product out",
      "key out",
      "green screen",
      "studio backdrop"
    ]
  },
  { kind: "imageSticker", needles: ["sticker", "decals", "badge"] },
  { kind: "imageRelight", needles: ["relight"] },
  {
    kind: "imageUpscale",
    needles: ["image upscale", "upscale a still", "print resolution", "then upscale"]
  },
  {
    kind: "imageCrop",
    needles: ["crop", "fit an image", "pad a canvas", "resize for"]
  },
  {
    kind: "imageFilter",
    needles: [
      "blur",
      "sharpen",
      "saturation",
      "invert",
      "emboss",
      "pixelate",
      "vignette",
      "solarize",
      "posterize",
      "black and white",
      "8 bits",
      "four bits",
      "soften",
      "enhance",
      "swirl"
    ]
  },
  {
    kind: "imageEdit",
    needles: [
      "image to image",
      "edit a still",
      "restyle",
      "illustration",
      "with words",
      "photo as"
    ]
  },
  {
    kind: "imageDraw",
    needles: ["gradient", "circles and lines", "draw a", "vectorize"]
  },
  { kind: "video3d", needles: ["c4d"] },
  { kind: "videoMotion", needles: ["motion control"] },
  { kind: "videoReference", needles: ["reference to video"] },
  { kind: "videoExtend", needles: ["video extend"] },
  { kind: "videoUpscale", needles: ["video upscale"] },
  {
    kind: "videoAnimate",
    needles: [
      "image to video",
      "bring a still to life",
      "moving version",
      "animation"
    ]
  },
  {
    kind: "videoColor",
    needles: ["color boost", "warm up a cold", "denoise footage"]
  },
  {
    kind: "videoEdit",
    needles: [
      "trim a clip",
      "slow a clip",
      "reverse a clip",
      "rotate footage",
      "stabilize",
      "picture in picture",
      "cut a landscape",
      "pull a still from a clip",
      "inspect a clip",
      "frame rate",
      "first few seconds"
    ]
  },
  {
    kind: "videoGenerate",
    needles: [
      "text to video",
      "explainer clip",
      "product video",
      "product spot",
      "b-roll",
      "trailer",
      "short film",
      "shot list",
      "single shot",
      "script to screen",
      "directed film",
      "spokesperson",
      "ad loop",
      "turntable",
      "music video",
      "clip on kie"
    ]
  },
  {
    kind: "imageGenerate",
    needles: [
      "text to image",
      "album art",
      "movie posters",
      "poster",
      "moodboard",
      "brand asset",
      "concept art",
      "pokemon",
      "mockup",
      "product shot",
      "editorial still",
      "write the prompt, then make"
    ]
  },
  { kind: "texture", needles: ["texture"] },
  { kind: "material", needles: ["material generation"] },
  { kind: "model3d", needles: ["to 3d", "3d"] },
  { kind: "audioSfx", needles: ["sound effect"] },
  {
    kind: "audioMusic",
    needles: ["music generator", "music bed", "score a", "silent bed"]
  },
  { kind: "audioFoley", needles: ["video to audio", "to audio"] },
  {
    kind: "audioEdit",
    needles: [
      "reverb",
      "fade audio",
      "pitch",
      "normalize a clip",
      "widen a mono",
      "gate out",
      "master a voice",
      "reverse audio",
      "trim audio",
      "inspect a clip's audio",
      "telephone voice"
    ]
  },
  {
    kind: "audioVoice",
    needles: [
      "voice narration",
      "narrat",
      "speak a line",
      "revoice",
      "transcribe",
      "subtitle",
      "meeting recording",
      "two voices"
    ]
  },
  { kind: "translate", needles: ["translate", "localise", "german"] },
  {
    kind: "chat",
    needles: ["chat with", "your documents", "vectorstore", "flashcard"]
  },
  {
    kind: "agent",
    needles: ["agent", "co-pilot", "private assistant", "model arena"]
  },
  {
    kind: "summarize",
    needles: [
      "summar",
      "show notes",
      "executive",
      "press release",
      "release notes",
      "bug report",
      "blog post",
      "action items",
      "chapter markers"
    ]
  },
  {
    kind: "schedule",
    needles: [
      "webhook",
      "every hour",
      "watch a folder",
      "run button",
      "workflow as a tool"
    ]
  },
  {
    kind: "data",
    needles: [
      "csv",
      "table",
      "column",
      "rows",
      "join two",
      "sort a",
      "json to",
      "average",
      "dataframe",
      "duplicates"
    ]
  },
  {
    kind: "code",
    needles: [
      "boolean",
      "constant",
      "prompt template",
      "wrap a value",
      "validate a",
      "json text"
    ]
  },
  {
    kind: "search",
    needles: ["find every", "find and replace", "search key", "check a url"]
  },
  { kind: "web", needles: ["links out of a page", "rss", "hacker news"] },
  {
    kind: "list",
    needles: [
      "batch a list",
      "count a list",
      "every combination",
      "drop the first",
      "take the first few",
      "re-delimit"
    ]
  },
  {
    kind: "document",
    needles: ["transcript", "readme", "script", "listing", "copy", "headline"]
  },
  {
    kind: "text",
    needles: [
      "string",
      "title case",
      "redact",
      "slice text",
      "tidy up messy",
      "mentions the deadline"
    ]
  }
];

const TAG_RULES: ReadonlyArray<{
  kind: ExampleThumbnailKind;
  tags: readonly string[];
}> = [
  { kind: "model3d", tags: ["3d", "model3d", "model_3d"] },
  { kind: "videoGenerate", tags: ["video", "youtube"] },
  { kind: "imageGenerate", tags: ["image", "images", "design"] },
  { kind: "audioVoice", tags: ["audio", "music"] },
  { kind: "agent", tags: ["agent", "agents", "ai"] },
  { kind: "chat", tags: ["multimodal", "rag"] },
  { kind: "data", tags: ["data"] },
  { kind: "text", tags: ["text", "utility", "llm"] }
];

export const THUMBNAIL_COLORS: Record<ExampleThumbnailKind, string> = {
  imageGenerate: "#8EC8F8",
  imageEdit: "#7DD3FC",
  imageFill: "#67E8F9",
  imageErase: "#93C5FD",
  imageUpscale: "#38BDF8",
  imageCutout: "#7DD3FC",
  imageSticker: "#A5B4FC",
  imageRelight: "#FDE68A",
  imageCrop: "#93C5FD",
  imageFilter: "#67E8F9",
  imageDraw: "#C4B5FD",
  videoGenerate: "#5EEAD4",
  videoAnimate: "#6EE7B7",
  videoReference: "#34D399",
  videoMotion: "#2DD4BF",
  videoExtend: "#5EEAD4",
  videoUpscale: "#6EE7B7",
  video3d: "#22D3EE",
  videoEdit: "#2DD4BF",
  videoColor: "#F9A8D4",
  model3d: "#60A5FA",
  texture: "#818CF8",
  material: "#A78BFA",
  audioMusic: "#FBBF24",
  audioSfx: "#F59E0B",
  audioVoice: "#FB923C",
  audioFoley: "#FDBA74",
  audioEdit: "#FCD34D",
  text: "#D4C4F7",
  summarize: "#C4B5FD",
  translate: "#A78BFA",
  chat: "#B9A4F0",
  agent: "#A78BFA",
  data: "#86EFAC",
  code: "#D8B4FE",
  search: "#93C5FD",
  web: "#67E8F9",
  schedule: "#F9A8D4",
  document: "#C4B5FD",
  list: "#A5B4FC",
  sparkles: "#B9A4F0"
};

export function exampleThumbnailKind(workflow: {
  tags?: string[] | null;
  name?: string | null;
}): ExampleThumbnailKind {
  const name = (workflow.name ?? "").toLowerCase();
  for (const rule of NAME_RULES) {
    if (rule.needles.some((needle) => name.includes(needle))) {
      return rule.kind;
    }
  }
  const tags = new Set((workflow.tags ?? []).map((t) => t.toLowerCase()));
  for (const rule of TAG_RULES) {
    if (rule.tags.some((tag) => tags.has(tag))) {
      return rule.kind;
    }
  }
  return "sparkles";
}
