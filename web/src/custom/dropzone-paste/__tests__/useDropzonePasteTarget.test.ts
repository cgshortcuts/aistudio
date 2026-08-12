import { renderHook } from "@testing-library/react";
import type { Asset } from "../../../stores/ApiTypes";
import {
  DROPZONE_PASTE_ID_ATTR,
  findDropzonePasteTargetAt,
  resetDropzonePasteTarget
} from "../dropzonePasteTarget";
import { useDropzonePasteTarget } from "../useDropzonePasteTarget";

function stubElementFromPoint(el: Element | null): void {
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: () => el
  });
}

describe("useDropzonePasteTarget", () => {
  beforeEach(() => {
    resetDropzonePasteTarget();
  });

  it("registers the dropzone on mount so paste can find it under the pointer", () => {
    const applyAsset = jest.fn();
    const { result, unmount } = renderHook(() =>
      useDropzonePasteTarget({ mediaType: "image", applyAsset })
    );

    const zone = document.createElement("div");
    zone.setAttribute(DROPZONE_PASTE_ID_ATTR, result.current.pasteTargetId ?? "");
    document.body.appendChild(zone);
    stubElementFromPoint(zone);

    const target = findDropzonePasteTargetAt(1, 1);
    expect(target?.mediaType).toBe("image");

    const asset = { id: "asset-1", get_url: "https://cdn.example.com/a.png" } as Asset;
    target?.applyAsset(asset);
    expect(applyAsset).toHaveBeenCalledWith(asset);

    unmount();
    expect(findDropzonePasteTargetAt(1, 1)).toBeNull();
    zone.remove();
  });

  it("does not register document dropzones", () => {
    const { result } = renderHook(() =>
      useDropzonePasteTarget({ mediaType: "document", applyAsset: jest.fn() })
    );

    expect(result.current.pasteTargetId).toBeUndefined();
  });
});
