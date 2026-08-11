import { PAGE_TAB_TITLES } from "../../../components/workspace/pageTabs";
import { RAIL_APP_MENU_LABELS } from "../../rail-hover-labels/railAppMenuItems";
import {
  BROWSE_TEMPLATES_LABEL,
  TEMPLATES_PAGE_TITLE,
  templatesCountLabel
} from "../index";

describe("templates-label", () => {
  it("names the gallery Templates", () => {
    expect(TEMPLATES_PAGE_TITLE).toBe("Templates");
    expect(BROWSE_TEMPLATES_LABEL).toBe("Browse templates");
  });

  it("keeps the tab title and rail label in sync", () => {
    expect(PAGE_TAB_TITLES.examples).toBe(TEMPLATES_PAGE_TITLE);
    expect(RAIL_APP_MENU_LABELS.examples).toBe(TEMPLATES_PAGE_TITLE);
  });

  it("pluralizes the gallery count", () => {
    expect(templatesCountLabel(1)).toBe("1 template");
    expect(templatesCountLabel(0)).toBe("0 templates");
    expect(templatesCountLabel(12)).toBe("12 templates");
  });
});
