import { useEffect } from "react";
import { useSettingsStore } from "../../stores/SettingsStore";
import { isInstantUpdateAllowed } from "./allowed";

/** Clears a persisted Instant Update = On so auto-run cannot fire. */
export function useForceInstantUpdateOff(): void {
  const instantUpdate = useSettingsStore(
    (state) => state.settings.instantUpdate
  );
  const setInstantUpdate = useSettingsStore((state) => state.setInstantUpdate);

  useEffect(() => {
    if (!isInstantUpdateAllowed() && instantUpdate) {
      setInstantUpdate(false);
    }
  }, [instantUpdate, setInstantUpdate]);
}
