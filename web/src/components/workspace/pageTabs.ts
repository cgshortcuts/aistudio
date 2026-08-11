// App "pages" that open as workspace tabs (type: "page") instead of their own
// route. The title is looked up here so the tab bar and the logo menu stay in
// sync.
// === CUSTOM FORK START: templates-label ===
import { TEMPLATES_PAGE_TITLE } from "../../custom/templates-label";
// === CUSTOM FORK END ===

export type PageTabKey =
  | "assets"
  | "tutorials"
  | "examples"
  | "costs"
  | "models"
  | "packages"
  | "collections"
  | "workspaces"
  | "entities"
  | "settings";

export const PAGE_TAB_TITLES: Record<PageTabKey, string> = {
  assets: "Assets",
  tutorials: "Tutorials",
  // === CUSTOM FORK START: templates-label ===
  examples: TEMPLATES_PAGE_TITLE,
  // === CUSTOM FORK END ===
  costs: "Costs",
  models: "Model Manager",
  packages: "Package Manager",
  collections: "Collections",
  workspaces: "Workspaces",
  entities: "Entities",
  settings: "Settings"
};

export const isPageTabKey = (value: string): value is PageTabKey =>
  Object.prototype.hasOwnProperty.call(PAGE_TAB_TITLES, value);
