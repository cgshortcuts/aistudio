import { act } from "@testing-library/react";

import {
  resetAssetSearchAutofocusStore,
  useAssetSearchAutofocusStore
} from "../AssetSearchAutofocusStore";
import { notifyLibrarySearchIfOpening } from "../notifyAssetSearchFocus";

describe("notifyAssetSearchFocus", () => {
  beforeEach(() => {
    resetAssetSearchAutofocusStore();
  });

  it("requests library focus when the library panel will open", () => {
    act(() => {
      notifyLibrarySearchIfOpening(
        { activeView: "workflows", isVisible: true },
        "library"
      );
    });

    const state = useAssetSearchAutofocusStore.getState();
    expect(state.generation).toBe(1);
    expect(state.surface).toBe("library");
  });

  it("does not request focus when library is already visible", () => {
    act(() => {
      notifyLibrarySearchIfOpening(
        { activeView: "library", isVisible: true },
        "library"
      );
    });

    expect(useAssetSearchAutofocusStore.getState().generation).toBe(0);
  });

  it("ignores other left-panel views", () => {
    act(() => {
      notifyLibrarySearchIfOpening(
        { activeView: "workflows", isVisible: false },
        "assets"
      );
    });

    expect(useAssetSearchAutofocusStore.getState().generation).toBe(0);
  });
});
