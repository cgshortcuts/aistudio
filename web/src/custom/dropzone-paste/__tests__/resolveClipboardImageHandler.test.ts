import type { Asset } from "../../../stores/ApiTypes";
import * as MousePosition from "../../../utils/MousePosition";
import {
  DROPZONE_PASTE_ID_ATTR,
  registerDropzonePasteTarget,
  resetDropzonePasteTarget
} from "../dropzonePasteTarget";
import { resolveClipboardImageHandler } from "../resolveClipboardImageHandler";

function stubElementFromPoint(el: Element | null): void {
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: () => el
  });
}

describe("resolveClipboardImageHandler", () => {
  const fallback = jest.fn();
  const applyAsset = jest.fn();
  const asset = {
    id: "asset-1",
    get_url: "https://cdn.example.com/a.png"
  } as Asset;

  beforeEach(() => {
    resetDropzonePasteTarget();
    fallback.mockClear();
    applyAsset.mockClear();
    jest.spyOn(MousePosition, "getMousePosition").mockReturnValue({ x: 12, y: 34 });
  });

  it("uses the canvas fallback when no dropzone is under the pointer", () => {
    stubElementFromPoint(document.body);

    const handler = resolveClipboardImageHandler(fallback);
    handler(asset);

    expect(fallback).toHaveBeenCalledWith(asset);
    expect(applyAsset).not.toHaveBeenCalled();
  });

  it("applies the image to the dropzone under the pointer", () => {
    registerDropzonePasteTarget({
      id: "zone-a",
      mediaType: "image",
      applyAsset
    });
    const zone = document.createElement("div");
    zone.setAttribute(DROPZONE_PASTE_ID_ATTR, "zone-a");
    stubElementFromPoint(zone);

    const handler = resolveClipboardImageHandler(fallback);
    handler(asset);

    expect(applyAsset).toHaveBeenCalledWith(asset);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("uses the canvas fallback when the dropzone under the pointer is not an image", () => {
    registerDropzonePasteTarget({
      id: "zone-a",
      mediaType: "audio",
      applyAsset
    });
    const zone = document.createElement("div");
    zone.setAttribute(DROPZONE_PASTE_ID_ATTR, "zone-a");
    stubElementFromPoint(zone);

    const handler = resolveClipboardImageHandler(fallback);
    handler(asset);

    expect(fallback).toHaveBeenCalledWith(asset);
    expect(applyAsset).not.toHaveBeenCalled();
  });
});
