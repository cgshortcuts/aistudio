/** @jsxImportSource @emotion/react */
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExtensionOutlinedIcon from "@mui/icons-material/ExtensionOutlined";
import {
  Card,
  Caption,
  Chip,
  EditorButton,
  FlexColumn,
  FlexRow,
  LoadingSpinner,
  Text,
  TextLink,
  BORDER_RADIUS,
  SPACING,
  getSpacingPx
} from "../../ui_primitives";
// === CUSTOM FORK START: AiStudio Branding ===
import { APP_DISPLAY_NAME } from "../../../custom/branding";
// === CUSTOM FORK END ===
import useNodePacksStore from "../../../stores/NodePacksStore";
import { useShallow } from "zustand/react/shallow";
import { useOpenPackageManagerInNewTab } from "../../../hooks/useOpenPackageManager";
import {
  ONBOARDING_ENGINES,
  ONBOARDING_NODE_PACKS,
  type OnboardingEngine,
  type OnboardingNodePack
} from "./onboardingCatalog";
// === CUSTOM FORK START: Product Profile ===
import {
  isChatAndAgentsHidden,
  showOptionalNodePacks,
  visibleOnboardingEngines,
  visibleOnboardingNodePacks
} from "../../../custom/product-profile";
// === CUSTOM FORK END ===

const EngineCard: React.FC<{ engine: OnboardingEngine }> = ({ engine }) => {
  const theme = useTheme();
  const statusChip = engine.bundled ? (
    <Chip label="Bundled" compact color="success" variant="outlined" />
  ) : engine.runtimeId ? (
    <Chip label="Runtime" compact variant="outlined" />
  ) : null;

  return (
    <Card
      variant="outlined"
      padding="normal"
      sx={{
        borderRadius: BORDER_RADIUS.md,
        border: `1px solid ${theme.vars.palette.divider}`,
        backgroundColor: theme.vars.palette.background.paper,
        height: "100%"
      }}
    >
      <FlexColumn gap={SPACING.xs} sx={{ height: "100%" }}>
        <FlexRow gap={SPACING.xs} align="center" justify="space-between">
          <Text size="normal" weight={600}>
            {engine.name}
          </Text>
          {statusChip}
        </FlexRow>
        <Caption sx={{ color: theme.vars.palette.primary.main }}>
          {engine.tagline}
        </Caption>
        <Caption sx={{ opacity: 0.7, lineHeight: 1.5, flex: 1 }}>
          {engine.description}
        </Caption>
        {engine.platform && (
          <Caption sx={{ opacity: 0.55 }}>{engine.platform}</Caption>
        )}
        <FlexRow
          gap={SPACING.micro}
          sx={{ flexWrap: "wrap", mt: SPACING.micro }}
        >
          {engine.formats.map((fmt) => (
            <Chip key={fmt} label={fmt} compact variant="outlined" />
          ))}
        </FlexRow>
        <TextLink
          href={engine.docsUrl}
          external
          sx={{ mt: SPACING.micro, fontSize: "var(--fontSizeSmall)" }}
        >
          Learn more <OpenInNewIcon sx={{ fontSize: 12, ml: SPACING.micro }} />
        </TextLink>
      </FlexColumn>
    </Card>
  );
};

const NodePackRow: React.FC<{ pack: OnboardingNodePack }> = ({ pack }) => {
  const theme = useTheme();
  // Select primitives only — deriving a new array inside the selector would
  // change the snapshot on every render and loop useSyncExternalStore.
  const available = useNodePacksStore((state) => state.available);
  const install = useNodePacksStore((state) => state.install);
  const isInstalled = useNodePacksStore((state) =>
    state.installed.some((p) => p.repo_id === pack.repoId)
  );
  const isBusy = useNodePacksStore((state) => state.busyIds.includes(pack.repoId));
  const openPackageManager = useOpenPackageManagerInNewTab();

  // === CUSTOM FORK START: Product Profile ===
  const showPackageManager = showOptionalNodePacks();
  // === CUSTOM FORK END ===

  const handleInstall = useCallback(() => {
    if (available) {
      void install(pack.repoId);
    } else if (showPackageManager) {
      openPackageManager();
    }
  }, [available, install, openPackageManager, pack.repoId, showPackageManager]);

  return (
    <FlexRow
      gap={SPACING.md}
      align="center"
      justify="space-between"
      sx={{
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.sm,
        border: `1px solid ${theme.vars.palette.divider}`,
        backgroundColor: theme.vars.palette.background.paper
      }}
    >
      <FlexColumn gap={SPACING.micro} sx={{ minWidth: 0 }}>
        <Text size="small" weight={600}>
          {pack.name}
        </Text>
        <Caption sx={{ opacity: 0.7, lineHeight: 1.4 }}>
          {pack.description}
        </Caption>
      </FlexColumn>
      {isInstalled ? (
        <FlexRow gap={SPACING.micro} align="center" sx={{ flexShrink: 0 }}>
          <CheckCircleIcon
            sx={{ fontSize: 16, color: theme.vars.palette.success.main }}
          />
          <Caption color="secondary">Installed</Caption>
        </FlexRow>
      ) : available || showPackageManager ? (
        <EditorButton
          variant="outlined"
          density="compact"
          size="small"
          disabled={isBusy}
          onClick={handleInstall}
          startIcon={
            isBusy ? (
              <LoadingSpinner inline size={14} />
            ) : (
              <ExtensionOutlinedIcon sx={{ fontSize: 15 }} />
            )
          }
          sx={{ flexShrink: 0 }}
        >
          {available ? "Install" : "Open Manager"}
        </EditorButton>
      ) : null}
    </FlexRow>
  );
};

const EngineGuide: React.FC = () => {
  const theme = useTheme();
  const { available, refresh } = useNodePacksStore(
    useShallow((state) => ({
      available: state.available,
      refresh: state.refresh
    }))
  );
  const openPackageManager = useOpenPackageManagerInNewTab();

  useEffect(() => {
    if (available) {
      void refresh();
    }
  }, [available, refresh]);

  // === CUSTOM FORK START: Product Profile ===
  const engines = useMemo(
    () => visibleOnboardingEngines(ONBOARDING_ENGINES),
    []
  );
  const nodePacks = useMemo(
    () => visibleOnboardingNodePacks(ONBOARDING_NODE_PACKS),
    []
  );
  const hideCustomerSurfaces = isChatAndAgentsHidden();
  const showPackageManager = showOptionalNodePacks();
  // === CUSTOM FORK END ===

  return (
    <FlexColumn gap={SPACING.lg}>
      <FlexColumn gap={SPACING.sm}>
        <FlexColumn gap={SPACING.micro}>
          <Text size="big" weight={600}>
            Local engines
          </Text>
          <Caption sx={{ opacity: 0.7 }}>
            {/* === CUSTOM FORK START: Product Profile === */}
            {hideCustomerSurfaces
              ? `${APP_DISPLAY_NAME} runs local image, video, and speech models through Hugging Face / Diffusers.`
              : `${APP_DISPLAY_NAME} runs models through these engines. Ollama is the easiest start; the others unlock more model types.`}
            {/* === CUSTOM FORK END === */}
          </Caption>
        </FlexColumn>
        <div
          css={{
            display: "grid",
            gap: getSpacingPx(SPACING.lg),
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))"
          }}
        >
          {engines.map((engine) => (
            <EngineCard key={engine.id} engine={engine} />
          ))}
        </div>
      </FlexColumn>

      {nodePacks.length > 0 && (
      <FlexColumn gap={SPACING.sm}>
        <FlexRow gap={SPACING.xs} align="center" justify="space-between">
          <FlexColumn gap={SPACING.micro}>
            <Text size="big" weight={600}>
              Node packs
            </Text>
            <Caption sx={{ opacity: 0.7 }}>
              {available
                ? "Install the packs that add the nodes you want to use."
                : showPackageManager
                  ? "Node packs install from the desktop app's Package Manager."
                  : "Install the Hugging Face pack to run local image and speech models."}
            </Caption>
          </FlexColumn>
          {/* === CUSTOM FORK START: Product Profile === */}
          {showPackageManager && (
            <EditorButton
              variant="text"
              density="compact"
              size="small"
              endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
              onClick={openPackageManager}
            >
              Package Manager
            </EditorButton>
          )}
          {/* === CUSTOM FORK END === */}
        </FlexRow>
        <FlexColumn gap={SPACING.xs}>
          {nodePacks.map((pack) => (
            <NodePackRow key={pack.repoId} pack={pack} />
          ))}
        </FlexColumn>
        {!available && showPackageManager && (
          <Caption sx={{ opacity: 0.55, color: theme.vars.palette.text.secondary }}>
            Running in the browser? Model downloads still work here — node packs
            and runtimes are managed in the desktop app.
          </Caption>
        )}
      </FlexColumn>
      )}
    </FlexColumn>
  );
};

export default memo(EngineGuide);
