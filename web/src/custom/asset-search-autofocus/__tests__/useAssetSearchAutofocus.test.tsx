import { act, renderHook } from "@testing-library/react";

import {
  requestAssetSearchFocus,
  resetAssetSearchAutofocusStore
} from "../AssetSearchAutofocusStore";
import { useAssetSearchAutofocus } from "../useAssetSearchAutofocus";

jest.mock("../../../hooks/useAutoFocusEnabled", () => ({
  useAutoFocusEnabled: () => true
}));

describe("useAssetSearchAutofocus", () => {
  beforeEach(() => {
    resetAssetSearchAutofocusStore();
  });

  it("starts expanded for library and does not focus until requested", () => {
    const { result } = renderHook(() => useAssetSearchAutofocus("library"));

    expect(result.current.expanded).toBe(true);
    expect(result.current.focusSearchInput).toBe(false);
    expect(result.current.focusNonce).toBe(0);
  });

  it("starts collapsed when no autofocus surface is set", () => {
    const { result } = renderHook(() => useAssetSearchAutofocus(undefined));

    expect(result.current.expanded).toBe(false);
    expect(result.current.focusSearchInput).toBe(false);
  });

  it("expands and focuses when library focus is requested", () => {
    const { result } = renderHook(() => useAssetSearchAutofocus("library"));

    act(() => {
      result.current.setExpanded(false);
    });
    expect(result.current.expanded).toBe(false);

    act(() => {
      requestAssetSearchFocus("library");
    });

    expect(result.current.expanded).toBe(true);
    expect(result.current.focusSearchInput).toBe(true);
    expect(result.current.focusNonce).toBe(1);
  });
});
