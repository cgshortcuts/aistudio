import { act, renderHook } from "@testing-library/react";
import { useSettingsStore } from "../../../stores/SettingsStore";
import {
  isInstantUpdateAllowed,
  useForceInstantUpdateOff
} from "../index";

describe("instant-update fork", () => {
  const initialState = useSettingsStore.getState();

  afterEach(() => {
    useSettingsStore.setState(initialState, true);
    localStorage.clear();
  });

  it("does not allow Instant Update", () => {
    expect(isInstantUpdateAllowed()).toBe(false);
  });

  it("turns a persisted-on setting off", () => {
    act(() => {
      useSettingsStore.getState().setInstantUpdate(true);
    });
    expect(useSettingsStore.getState().settings.instantUpdate).toBe(true);

    renderHook(() => useForceInstantUpdateOff());

    expect(useSettingsStore.getState().settings.instantUpdate).toBe(false);
  });

  it("leaves Instant Update off when it is already off", () => {
    act(() => {
      useSettingsStore.getState().setInstantUpdate(false);
    });

    renderHook(() => useForceInstantUpdateOff());

    expect(useSettingsStore.getState().settings.instantUpdate).toBe(false);
  });
});
