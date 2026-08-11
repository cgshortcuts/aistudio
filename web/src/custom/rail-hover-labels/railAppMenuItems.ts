/**
 * App-page destinations that used to live only in the logo popover.
 * Desktop renders them as rail rows; mobile still uses the popover.
 */
export const RAIL_APP_MENU_ORDER = [
  "dashboard",
  "tutorials",
  "examples",
  "costs",
  "models",
  "packages",
  "assets",
  "collections",
  "entities",
  "workspaces",
  "settings",
  "help",
  "downloads"
] as const;

export type RailAppMenuId = (typeof RAIL_APP_MENU_ORDER)[number];

export const RAIL_APP_PAGE_IDS = [
  "tutorials",
  "examples",
  "costs",
  "models",
  "packages",
  "assets",
  "collections",
  "entities",
  "workspaces",
  "settings"
] as const satisfies readonly RailAppMenuId[];

export const RAIL_APP_MENU_LABELS: Record<RailAppMenuId, string> = {
  dashboard: "Dashboard",
  tutorials: "Tutorials",
  examples: "Examples",
  costs: "Costs",
  models: "Model Manager",
  packages: "Package Manager",
  assets: "Assets",
  collections: "Collections",
  entities: "Entities",
  workspaces: "Workspaces",
  settings: "Settings",
  help: "Help",
  downloads: "Downloads"
};

const HIDDEN_IN_PRODUCTION = new Set<RailAppMenuId>(["packages", "workspaces"]);
const HIDDEN_FOR_CUSTOMER = new Set<RailAppMenuId>([
  "dashboard",
  "tutorials",
  "packages",
  "collections",
  "workspaces"
]);

export function visibleRailAppMenuIds(options: {
  isProduction: boolean;
  hideCustomerSurfaces: boolean;
}): RailAppMenuId[] {
  return RAIL_APP_MENU_ORDER.filter((id) => {
    if (options.isProduction && HIDDEN_IN_PRODUCTION.has(id)) {
      return false;
    }
    if (options.hideCustomerSurfaces && HIDDEN_FOR_CUSTOMER.has(id)) {
      return false;
    }
    return true;
  });
}

export function railAppMenuDividerAfter(
  id: RailAppMenuId,
  visibleIds: readonly RailAppMenuId[]
): boolean {
  if (id === "costs") {
    return true;
  }
  if (id === "workspaces") {
    return true;
  }
  if (id === "entities") {
    return !visibleIds.includes("workspaces");
  }
  return false;
}
