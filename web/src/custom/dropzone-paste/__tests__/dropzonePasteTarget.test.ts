import type { Asset } from "../../../stores/ApiTypes";
import {
  DROPZONE_PASTE_ID_ATTR,
  findDropzonePasteTargetAt,
  isDropzonePasteMediaType,
  registerDropzonePasteTarget,
  resetDropzonePasteTarget,
  unregisterDropzonePasteTarget
} from "../dropzonePasteTarget";

function stubElementFromPoint(el: Element | null): void {
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: () => el
  });
}

const applyAsset = jest.fn();

describe("dropzonePasteTarget", () => {
  beforeEach(() => {
    resetDropzonePasteTarget();
    applyAsset.mockClear();
  });

  it("finds the registered dropzone under the pointer", () => {
    registerDropzonePasteTarget({
      id: "zone-a",
      mediaType: "image",
      applyAsset
    });

    const zone = document.createElement("div");
    zone.setAttribute(DROPZONE_PASTE_ID_ATTR, "zone-a");
    document.body.appendChild(zone);
    stubElementFromPoint(zone);

    expect(findDropzonePasteTargetAt(10, 20)?.id).toBe("zone-a");

    zone.remove();
  });

  it("finds a dropzone from a nested child under the pointer", () => {
    registerDropzonePasteTarget({
      id: "zone-a",
      mediaType: "image",
      applyAsset
    });

    const zone = document.createElement("div");
    zone.setAttribute(DROPZONE_PASTE_ID_ATTR, "zone-a");
    const child = document.createElement("img");
    zone.appendChild(child);
    document.body.appendChild(zone);
    stubElementFromPoint(child);

    expect(findDropzonePasteTargetAt(10, 20)?.id).toBe("zone-a");

    zone.remove();
  });

  it("returns null when the pointer is not over a dropzone", () => {
    registerDropzonePasteTarget({
      id: "zone-a",
      mediaType: "image",
      applyAsset
    });
    stubElementFromPoint(document.body);

    expect(findDropzonePasteTargetAt(10, 20)).toBeNull();
  });

  it("unregisters a dropzone so it is no longer found", () => {
    registerDropzonePasteTarget({
      id: "zone-a",
      mediaType: "image",
      applyAsset
    });
    unregisterDropzonePasteTarget("zone-a");

    const zone = document.createElement("div");
    zone.setAttribute(DROPZONE_PASTE_ID_ATTR, "zone-a");
    stubElementFromPoint(zone);

    expect(findDropzonePasteTargetAt(10, 20)).toBeNull();
  });

  it("accepts image, audio, and video media types", () => {
    expect(isDropzonePasteMediaType("image")).toBe(true);
    expect(isDropzonePasteMediaType("audio")).toBe(true);
    expect(isDropzonePasteMediaType("video")).toBe(true);
    expect(isDropzonePasteMediaType("document")).toBe(false);
  });
});
