/**
 * The Studio model policy: every new Studio project is stamped with NodeTool's
 * own managed models — the `nodetool` provider — so beginners never see a
 * model picker and never need an API key. Those calls run on platform keys
 * and are metered against the credit balance; users who dig into the reused
 * editors can still pick any BYOK provider, unmetered.
 *
 * The curated catalog itself (ids, names, delegates) is
 * `NODETOOL_MODELS` in `@nodetool-ai/protocol` — this file just selects which
 * entry fills each Studio role.
 */

import type {
  ImageModelValue,
  LanguageModelValue,
  VideoModelValue
} from "../stores/ApiTypes";
// === CUSTOM FORK START: AiStudio Branding ===
import { APP_DISPLAY_NAME } from "../custom/branding";
// === CUSTOM FORK END ===

/** Directs screenplays and drives the in-editor assistants. */
export const STUDIO_DIRECTOR_MODEL: LanguageModelValue = {
  type: "language_model",
  id: "nodetool/director",
  provider: "nodetool",
  name: `${APP_DISPLAY_NAME} Director`
};

/** Renders storyboard keyframe stills. */
export const STUDIO_STILL_MODEL: ImageModelValue = {
  type: "image_model",
  id: "nodetool/flux-schnell",
  provider: "nodetool",
  name: `${APP_DISPLAY_NAME} Still (FLUX Schnell)`,
  path: ""
};

/** Animates keyframes into shot clips. */
export const STUDIO_CLIP_MODEL: VideoModelValue = {
  type: "video_model",
  id: "nodetool/kling-standard",
  provider: "nodetool",
  name: `${APP_DISPLAY_NAME} Clip (Kling Standard)`
};
