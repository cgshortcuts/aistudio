/**
 * Split the shared music-model catalog into song models vs sound-effect
 * models. Providers list both under `getAvailableMusicModels()` (Kie
 * generate-music / generate-sounds, FAL text_to_audio including SFX).
 */

const SOUND_NEEDLES = [
  "generate-sounds",
  "sound-effect",
  "sound_effect",
  "sound effect",
  "soundeffects",
  "text-to-sound",
  "text_to_sound",
  "texttosound",
  "/sfx",
  "sfx/",
  "sfx1",
  "-sfx",
  "sfx-",
  "_sfx"
] as const;

export interface MusicModelKindInput {
  id?: string | null;
  name?: string | null;
  supported_tasks?: string[] | null;
}

/** True when this catalog entry is a sound-effect / SFX generator. */
export function isSoundModel(model: MusicModelKindInput): boolean {
  const hay =
    `${model.id ?? ""} ${model.name ?? ""} ${(model.supported_tasks ?? []).join(" ")}`.toLowerCase();
  if (hay.includes("soundtrack")) {
    return false;
  }
  if (SOUND_NEEDLES.some((needle) => hay.includes(needle))) {
    return true;
  }
  return /(^|[^a-z])sfx([^a-z]|$)/.test(hay);
}

/** True when this catalog entry is a song / music generator. */
export function isMusicModel(model: MusicModelKindInput): boolean {
  return !isSoundModel(model);
}
