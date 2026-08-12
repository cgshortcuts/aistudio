import { NODE_EDITOR_SHORTCUTS, Shortcut } from "../shortcuts";

describe("NODE_EDITOR_SHORTCUTS", () => {
  describe("resetZoom shortcut", () => {
    const resetZoomShortcut = NODE_EDITOR_SHORTCUTS.find(
      (s: Shortcut) => s.slug === "resetZoom"
    );

    it("should have correct keyCombo for non-Mac", () => {
      expect(resetZoomShortcut?.keyCombo).toEqual(["Control", "0"]);
    });

    it("should have correct category", () => {
      expect(resetZoomShortcut?.category).toBe("editor");
    });

    it("should be registerable", () => {
      expect(resetZoomShortcut?.registerCombo).toBe(true);
    });

    it("should have title", () => {
      expect(resetZoomShortcut?.title).toBe("Reset Zoom");
    });
  });

  describe("shortcut count", () => {
    it("should have expected number of editor shortcuts", () => {
      const editorShortcuts = NODE_EDITOR_SHORTCUTS.filter(
        (s: Shortcut) => s.category === "editor"
      );
      expect(editorShortcuts.length).toBeGreaterThan(20);
    });

    it("should have resetZoom in the list", () => {
      const slugs = NODE_EDITOR_SHORTCUTS.map((s: Shortcut) => s.slug);
      expect(slugs).toContain("resetZoom");
    });

    it("should have unique slugs", () => {
      const slugs = NODE_EDITOR_SHORTCUTS.map((s: Shortcut) => s.slug);
      const uniqueSlugs = new Set(slugs);
      expect(slugs.length).toBe(uniqueSlugs.size);
    });
  });

  describe("tab-node-menu remaps", () => {
    it("opens the node menu with Tab", () => {
      const shortcut = NODE_EDITOR_SHORTCUTS.find(
        (s: Shortcut) => s.slug === "openNodeMenu"
      );
      expect(shortcut?.keyCombo).toEqual(["Tab"]);
    });

    it("moves node focus with Control+Tab, not Cmd+Tab on Mac", () => {
      const next = NODE_EDITOR_SHORTCUTS.find(
        (s: Shortcut) => s.slug === "navigateNextNode"
      );
      const prev = NODE_EDITOR_SHORTCUTS.find(
        (s: Shortcut) => s.slug === "navigatePrevNode"
      );
      expect(next?.keyCombo).toEqual(["Control", "Tab"]);
      expect(next?.keyComboMac).toEqual(["Control", "Tab"]);
      expect(prev?.keyCombo).toEqual(["Control", "Shift", "Tab"]);
      expect(prev?.keyComboMac).toEqual(["Control", "Shift", "Tab"]);
    });
  });

  describe("skipInElectron", () => {
    it("clipboard shortcuts (copy, cut, paste) should have skipInElectron set", () => {
      const clipboardSlugs = ["copy", "cut", "paste"];
      clipboardSlugs.forEach((slug) => {
        const shortcut = NODE_EDITOR_SHORTCUTS.find(
          (s: Shortcut) => s.slug === slug
        );
        expect(shortcut).toBeDefined();
        expect(shortcut?.skipInElectron).toBe(true);
      });
    });
  });
});
