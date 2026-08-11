import {
  RAIL_APP_MENU_ORDER,
  railAppMenuDividerAfter,
  visibleRailAppMenuIds
} from "../railAppMenuItems";

describe("visibleRailAppMenuIds", () => {
  it("keeps every destination in full local mode", () => {
    expect(
      visibleRailAppMenuIds({
        isProduction: false,
        hideCustomerSurfaces: false
      })
    ).toEqual([...RAIL_APP_MENU_ORDER]);
  });

  it("hides Package Manager and Workspaces in production", () => {
    expect(
      visibleRailAppMenuIds({
        isProduction: true,
        hideCustomerSurfaces: false
      })
    ).toEqual(
      RAIL_APP_MENU_ORDER.filter(
        (id) => id !== "packages" && id !== "workspaces"
      )
    );
  });

  it("hides Dashboard, Tutorials, Collections, Package Manager, and Workspaces for customers", () => {
    expect(
      visibleRailAppMenuIds({
        isProduction: false,
        hideCustomerSurfaces: true
      })
    ).toEqual(
      RAIL_APP_MENU_ORDER.filter(
        (id) =>
          id !== "dashboard" &&
          id !== "tutorials" &&
          id !== "packages" &&
          id !== "collections" &&
          id !== "workspaces"
      )
    );
  });
});

describe("railAppMenuDividerAfter", () => {
  it("puts a divider after Costs", () => {
    expect(railAppMenuDividerAfter("costs", RAIL_APP_MENU_ORDER)).toBe(true);
  });

  it("puts a divider after Workspaces when that row is shown", () => {
    expect(railAppMenuDividerAfter("workspaces", RAIL_APP_MENU_ORDER)).toBe(
      true
    );
    expect(railAppMenuDividerAfter("entities", RAIL_APP_MENU_ORDER)).toBe(
      false
    );
  });

  it("puts a divider after Entities when Workspaces is hidden", () => {
    const withoutWorkspaces = RAIL_APP_MENU_ORDER.filter(
      (id) => id !== "workspaces"
    );
    expect(railAppMenuDividerAfter("entities", withoutWorkspaces)).toBe(true);
  });
});
