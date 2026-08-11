import React, { Suspense } from "react";

import { FlexColumn, LoadingSpinner, Text } from "../ui_primitives";
import { PAGE_TAB_TITLES, type PageTabKey } from "./pageTabs";
// === CUSTOM FORK START: Product Profile ===
import { isHiddenPageTab } from "../../custom/product-profile";
// === CUSTOM FORK END ===

const AssetExplorer = React.lazy(() => import("../assets/AssetExplorer"));
const TutorialsPage = React.lazy(() => import("../tutorials/TutorialsPage"));
const ExamplesPage = React.lazy(() => import("../portal/ExamplesPage"));
const CostsDashboard = React.lazy(() => import("../costs/CostsDashboard"));
const ModelsPage = React.lazy(
  () => import("../hugging_face/model_list/ModelsPage")
);
const PackagesPage = React.lazy(() => import("../packages/PackagesPage"));
const CollectionsExplorer = React.lazy(
  () => import("../collections/CollectionsExplorer")
);
const WorkspacesPage = React.lazy(
  () => import("../workspaces/WorkspacesPage")
);
const SettingsPage = React.lazy(() => import("../menus/SettingsMenu"));
const EntityLibrary = React.lazy(() => import("../entities/EntityLibrary"));

const PAGE_COMPONENTS: Record<PageTabKey, React.ComponentType> = {
  assets: AssetExplorer,
  tutorials: TutorialsPage,
  examples: ExamplesPage,
  costs: CostsDashboard,
  models: ModelsPage,
  packages: PackagesPage,
  collections: CollectionsExplorer,
  workspaces: WorkspacesPage,
  entities: EntityLibrary,
  settings: SettingsPage
};

const surfaceStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  minHeight: 0,
  overflow: "auto"
};

interface PageSurfaceProps {
  pageKey: PageTabKey;
}

/**
 * Renders an app page (Settings, Costs, Model Manager, …) inside a workspace
 * tab. Each page is the same self-contained component the old route mounted,
 * lazily loaded so it only costs bundle weight once its tab is opened.
 */
const PageSurface = ({ pageKey }: PageSurfaceProps) => {
  // === CUSTOM FORK START: Product Profile ===
  if (isHiddenPageTab(pageKey)) {
    return (
      <FlexColumn fullWidth fullHeight align="center" justify="center">
        <Text color="secondary">
          {PAGE_TAB_TITLES[pageKey]} is not available in this product.
        </Text>
      </FlexColumn>
    );
  }
  // === CUSTOM FORK END ===
  const Component = PAGE_COMPONENTS[pageKey];
  return (
    <div style={surfaceStyle} aria-label={PAGE_TAB_TITLES[pageKey]}>
      <Suspense fallback={<LoadingSpinner />}>
        <Component />
      </Suspense>
    </div>
  );
};

export default PageSurface;
