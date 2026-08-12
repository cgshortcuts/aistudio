/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import React from "react";

import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import ExtensionIcon from "@mui/icons-material/Extension";
import MemoryIcon from "@mui/icons-material/Memory";
import HubIcon from "@mui/icons-material/Hub";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import ChatIcon from "@mui/icons-material/Chat";
import ApiIcon from "@mui/icons-material/Api";

import openaiIcon from "../../icons/providers/openai.svg";
import anthropicIcon from "../../icons/providers/anthropic.svg";
import claudeColorIcon from "../../icons/providers/claude-color.svg";
import geminiColorIcon from "../../icons/providers/gemini-color.svg";
import huggingfaceColorIcon from "../../icons/providers/huggingface-color.svg";
import ollamaIcon from "../../icons/providers/ollama.svg";
import replicateIcon from "../../icons/providers/replicate.svg";
import falColorIcon from "../../icons/providers/fal-color.svg";
import mistralColorIcon from "../../icons/providers/mistral-color.svg";
import groqIcon from "../../icons/providers/groq.svg";
import deepseekColorIcon from "../../icons/providers/deepseek-color.svg";
import xaiIcon from "../../icons/providers/xai.svg";
import elevenlabsIcon from "../../icons/providers/elevenlabs.svg";
import atlascloudIcon from "../../icons/providers/atlascloud.svg";
import minimaxColorIcon from "../../icons/providers/minimax-color.svg";
import kieIcon from "../../icons/providers/kie.png";
import akiIcon from "../../icons/providers/aki.svg";
import apifyIcon from "../../icons/providers/apify.png";
import reveIcon from "../../icons/providers/reve.svg";
import rodinIcon from "../../icons/providers/rodin.png";
// === CUSTOM FORK START: BytePlus ===
import byteplusIcon from "../../custom/byteplus/byteplus.png";
// === CUSTOM FORK END ===

import { useIsDarkMode } from "../../hooks/useIsDarkMode";
import { MOTION, BORDER_RADIUS } from "../ui_primitives";

type SvgEntry = {
  kind: "svg";
  src: string;
  // When true, the icon is colored on a transparent background and looks fine
  // in dark mode. When false, we invert the icon in dark mode for visibility.
  preserveInDark?: boolean;
};

type MuiEntry = {
  kind: "mui";
  Component: React.ComponentType<{ fontSize?: "inherit" | "small" }>;
};

type IconEntry = SvgEntry | MuiEntry;

const NAMESPACE_ICONS: Record<string, IconEntry> = {
  // Local / abstract
  huggingface: { kind: "svg", src: huggingfaceColorIcon, preserveInDark: true },
  lib: { kind: "mui", Component: ExtensionIcon },
  mlx: { kind: "mui", Component: MemoryIcon },
  nodetool: { kind: "mui", Component: HubIcon },
  search: { kind: "mui", Component: SearchIcon },
  transformers: { kind: "mui", Component: AutoAwesomeIcon },
  vector: { kind: "mui", Component: ScatterPlotIcon },

  // Providers
  anthropic: { kind: "svg", src: anthropicIcon },
  claude: { kind: "svg", src: claudeColorIcon, preserveInDark: true },
  apify: { kind: "svg", src: apifyIcon, preserveInDark: true },
  atlascloud: { kind: "svg", src: atlascloudIcon },
  aki: { kind: "svg", src: akiIcon, preserveInDark: true },
  elevenlabs: { kind: "svg", src: elevenlabsIcon },
  fal: { kind: "svg", src: falColorIcon, preserveInDark: true },
  gemini: { kind: "svg", src: geminiColorIcon, preserveInDark: true },
  google: { kind: "svg", src: geminiColorIcon, preserveInDark: true },
  kie: { kind: "svg", src: kieIcon, preserveInDark: true },
  messaging: { kind: "mui", Component: ChatIcon },
  minimax: { kind: "svg", src: minimaxColorIcon, preserveInDark: true },
  mistral: { kind: "svg", src: mistralColorIcon, preserveInDark: true },
  openai: { kind: "svg", src: openaiIcon },
  ollama: { kind: "svg", src: ollamaIcon },
  replicate: { kind: "svg", src: replicateIcon },
  reve: { kind: "svg", src: reveIcon },
  rodin: { kind: "svg", src: rodinIcon, preserveInDark: true },
  groq: { kind: "svg", src: groqIcon },
  deepseek: { kind: "svg", src: deepseekColorIcon, preserveInDark: true },
  xai: { kind: "svg", src: xaiIcon },
  // === CUSTOM FORK START: BytePlus ===
  byteplus: { kind: "svg", src: byteplusIcon, preserveInDark: true }
  // === CUSTOM FORK END ===
};

const FALLBACK_ENTRY: MuiEntry = { kind: "mui", Component: ApiIcon };

const HOME_ENTRY: MuiEntry = { kind: "mui", Component: HomeIcon };

const iconBoxStyles = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 16,
  height: 16,
  flexShrink: 0,
  lineHeight: 0,
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "contain"
  },
  "& .MuiSvgIcon-root": {
    fontSize: 16
  }
});

// Rounded badge that frames the real provider/namespace icon, giving the
// sidebar a consistent app-launcher look regardless of icon shape.
const badgeStyles = (theme: Theme) =>
  css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    flexShrink: 0,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: theme.vars.palette.action.hover,
    border: `1px solid ${theme.vars.palette.divider}`,
    transition: `${MOTION.background}, border-color ${MOTION.fast}`
  });

interface NamespaceIconProps {
  namespace: string;
}

const renderEntry = (entry: IconEntry, isDarkMode: boolean) => {
  if (entry.kind === "mui") {
    const { Component } = entry;
    return <Component fontSize="inherit" />;
  }
  const filter =
    isDarkMode && !entry.preserveInDark
      ? "invert(1) brightness(1.1) contrast(0.9)"
      : undefined;
  return <img src={entry.src} alt="" style={filter ? { filter } : undefined} />;
};

const NamespaceBadge: React.FC<{ entry: IconEntry }> = ({ entry }) => {
  const isDarkMode = useIsDarkMode();
  const theme = useTheme();
  return (
    <span css={badgeStyles(theme)} className="namespace-icon">
      <span css={iconBoxStyles} className="namespace-icon-glyph">
        {renderEntry(entry, isDarkMode)}
      </span>
    </span>
  );
};

const NamespaceIcon: React.FC<NamespaceIconProps> = ({ namespace }) => {
  const key = namespace.toLowerCase();
  const entry = NAMESPACE_ICONS[key] ?? FALLBACK_ENTRY;
  return <NamespaceBadge entry={entry} />;
};

export const HomeNamespaceIcon: React.FC = () => (
  <NamespaceBadge entry={HOME_ENTRY} />
);

export default React.memo(NamespaceIcon);
