import React, { memo } from "react";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ManagerPageLayout from "../panels/ManagerPageLayout";
import DashboardTemplates from "./DashboardTemplates";
// === CUSTOM FORK START: templates-label ===
import {
  TEMPLATES_PAGE_SUBTITLE,
  TEMPLATES_PAGE_TITLE
} from "../../custom/templates-label";
// === CUSTOM FORK END ===

/**
 * Full-screen Examples page. Reachable from the logo menu and the dashboard's
 * "Browse all" link; wraps the example/template browser in the shared manager
 * chrome (header + back button) and lets it own its scroll.
 */
const ExamplesPage: React.FC = () => (
  <ManagerPageLayout
    icon={<AutoAwesomeOutlinedIcon sx={{ fontSize: 22 }} />}
    // === CUSTOM FORK START: templates-label ===
    title={TEMPLATES_PAGE_TITLE}
    subtitle={TEMPLATES_PAGE_SUBTITLE}
    docsTopic="templates"
    // === CUSTOM FORK END ===
    padded={false}
  >
    <DashboardTemplates fullPage />
  </ManagerPageLayout>
);

ExamplesPage.displayName = "ExamplesPage";

export default memo(ExamplesPage);
