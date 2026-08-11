import { isMusicModel, isSoundModel } from "../musicModelKind";

describe("isSoundModel", () => {
  it("matches Kie generate-sounds", () => {
    expect(
      isSoundModel({ id: "generate-sounds", name: "Generate Sounds" })
    ).toBe(true);
    expect(isMusicModel({ id: "generate-sounds", name: "Generate Sounds" })).toBe(
      false
    );
  });

  it("matches FAL SFX paths and ElevenLabs sound effects", () => {
    expect(
      isSoundModel({
        id: "fal-ai/stable-audio-3/small/sfx/text-to-audio",
        name: "Stable Audio SFX"
      })
    ).toBe(true);
    expect(
      isSoundModel({
        id: "fal.text_to_audio.ElevenLabsSoundEffectsV2",
        name: "ElevenLabs Sound Effects V2"
      })
    ).toBe(true);
    expect(
      isSoundModel({ id: "mirelo-ai/sfx1.6/text-to-audio", name: "SFX 1.6" })
    ).toBe(true);
  });

  it("does not treat song models as SFX", () => {
    expect(
      isSoundModel({ id: "generate-music", name: "Generate Music" })
    ).toBe(false);
    expect(isMusicModel({ id: "generate-music", name: "Generate Music" })).toBe(
      true
    );
    expect(
      isSoundModel({ id: "fal.text_to_audio.ElevenLabsMusic", name: "ElevenLabs Music" })
    ).toBe(false);
    expect(
      isSoundModel({ id: "minimax-music", name: "MiniMax soundtrack" })
    ).toBe(false);
  });
});
