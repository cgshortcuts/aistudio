import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { isChatAndAgentsHidden } from "./index";

/**
 * Send a dedicated route to `/workspace` when the customer product hides
 * that surface (dashboard, tutorials, collections, workspaces, studio).
 */
export const CustomerHiddenRedirect = ({
  children
}: {
  children: ReactNode;
}) => {
  if (isChatAndAgentsHidden()) {
    return <Navigate to="/workspace" replace />;
  }
  return children;
};
