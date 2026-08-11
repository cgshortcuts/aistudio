import { useCallback, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DownloadIcon from "@mui/icons-material/Download";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import FolderSpecialOutlinedIcon from "@mui/icons-material/FolderSpecialOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";

import { isProduction } from "../../lib/env";
import { useCombo } from "../../stores/KeyPressedStore";
import { useAppHeaderStore } from "../../stores/AppHeaderStore";
import { useModelDownloadStore } from "../../stores/ModelDownloadStore";
import { useWorkspaceTabsStore } from "../../stores/WorkspaceTabsStore";
import {
  PAGE_TAB_TITLES,
  type PageTabKey
} from "../../components/workspace/pageTabs";
import { isChatAndAgentsHidden } from "../product-profile";
import {
  RAIL_APP_MENU_LABELS,
  RAIL_APP_PAGE_IDS,
  railAppMenuDividerAfter,
  visibleRailAppMenuIds,
  type RailAppMenuId
} from "./railAppMenuItems";

const RAIL_APP_MENU_ICONS: Record<RailAppMenuId, ReactNode> = {
  dashboard: <SpaceDashboardOutlinedIcon />,
  tutorials: <SchoolOutlinedIcon />,
  examples: <AutoAwesomeOutlinedIcon />,
  costs: <PaidOutlinedIcon />,
  models: <ViewInArOutlinedIcon />,
  packages: <Inventory2OutlinedIcon />,
  assets: <PermMediaOutlinedIcon />,
  collections: <LibraryBooksOutlinedIcon />,
  entities: <PersonOutlineOutlinedIcon />,
  workspaces: <FolderSpecialOutlinedIcon />,
  settings: <SettingsIcon />,
  help: <HelpOutlineIcon />,
  downloads: <DownloadIcon />
};

const PAGE_ITEM_IDS = new Set<RailAppMenuId>(RAIL_APP_PAGE_IDS);

export interface RailAppMenuEntry {
  id: RailAppMenuId;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  secondary?: string;
  dividerAfter?: boolean;
}

export interface UseRailAppMenuOptions {
  onAction?: () => void;
}

export function useRailAppMenu({ onAction }: UseRailAppMenuOptions = {}): {
  items: RailAppMenuEntry[];
  helpOpen: boolean;
  handleCloseHelp: () => void;
} {
  const navigate = useNavigate();
  const hideCustomerSurfaces = isChatAndAgentsHidden();

  const { helpOpen, handleCloseHelp, handleOpenHelp, setHelpIndex } =
    useAppHeaderStore(
      useShallow((state) => ({
        helpOpen: state.helpOpen,
        handleCloseHelp: state.handleCloseHelp,
        handleOpenHelp: state.handleOpenHelp,
        setHelpIndex: state.setHelpIndex
      }))
    );

  const handleShowKeyboardShortcuts = useCallback(() => {
    setHelpIndex(1);
    handleOpenHelp();
  }, [setHelpIndex, handleOpenHelp]);

  useCombo(["Meta", "/"], handleShowKeyboardShortcuts);
  useCombo(["Control", "/"], handleShowKeyboardShortcuts);

  const openTab = useWorkspaceTabsStore((state) => state.openTab);

  const finish = useCallback(() => {
    onAction?.();
  }, [onAction]);

  const openPage = useCallback(
    (key: PageTabKey) => {
      openTab({
        type: "page",
        ref: key,
        mode: "view",
        title: PAGE_TAB_TITLES[key]
      });
      navigate("/workspace");
      finish();
    },
    [openTab, navigate, finish]
  );

  const goDashboard = useCallback(() => {
    navigate("/dashboard");
    finish();
  }, [navigate, finish]);

  const openHelp = useCallback(() => {
    handleOpenHelp();
    finish();
  }, [handleOpenHelp, finish]);

  const { downloads, openDownloadsDialog } = useModelDownloadStore(
    useShallow((state) => ({
      downloads: state.downloads,
      openDownloadsDialog: state.openDialog
    }))
  );

  const downloadProgress = useMemo(() => {
    const active = Object.values(downloads).filter(
      (download) => download.status === "progress"
    );
    if (active.length === 0) {
      return null;
    }
    const total = active.reduce((sum, d) => sum + d.totalBytes, 0);
    const done = active.reduce((sum, d) => sum + d.downloadedBytes, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [downloads]);

  const openDownloads = useCallback(() => {
    openDownloadsDialog();
    finish();
  }, [openDownloadsDialog, finish]);

  const items = useMemo<RailAppMenuEntry[]>(() => {
    const visibleIds = visibleRailAppMenuIds({
      isProduction,
      hideCustomerSurfaces
    });
    const onClickFor = (id: RailAppMenuId): (() => void) => {
      if (id === "dashboard") {
        return goDashboard;
      }
      if (id === "help") {
        return openHelp;
      }
      if (id === "downloads") {
        return openDownloads;
      }
      if (PAGE_ITEM_IDS.has(id)) {
        return () => openPage(id as PageTabKey);
      }
      return finish;
    };

    return visibleIds.map((id) => ({
      id,
      label: RAIL_APP_MENU_LABELS[id],
      icon: RAIL_APP_MENU_ICONS[id],
      onClick: onClickFor(id),
      secondary:
        id === "downloads" && downloadProgress != null
          ? `${downloadProgress}%`
          : undefined,
      dividerAfter: railAppMenuDividerAfter(id, visibleIds)
    }));
  }, [
    hideCustomerSurfaces,
    goDashboard,
    openHelp,
    openDownloads,
    openPage,
    downloadProgress,
    finish
  ]);

  return { items, helpOpen, handleCloseHelp };
}
