/** @jsxImportSource @emotion/react */
import { memo, useEffect, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  FlexRow,
  RefreshButton,
  Tooltip,
  SPACING,
  CONTROL
} from "../../components/ui_primitives";
import useSecretsStore from "../../stores/SecretsStore";
import { TOOLTIP_ENTER_DELAY } from "../../config/constants";
import {
  connectedCreditProviders,
  type CreditProviderDef
} from "./creditProviders";
import {
  useProviderCredits,
  type ProviderCreditsEntry
} from "./useProviderCredits";

function formatEntry(
  provider: CreditProviderDef,
  entry: ProviderCreditsEntry | undefined
): { label: string; title: string; warn: boolean } {
  if (entry == null || entry.status === "loading") {
    return {
      label: `${provider.label} …`,
      title: `Loading ${provider.label} credits…`,
      warn: false
    };
  }
  if (entry.status === "empty" || entry.status === "error") {
    return {
      label: `${provider.label} —`,
      title: `${provider.label} credits unavailable. Click to open billing.`,
      warn: true
    };
  }
  const data = entry.data;
  if (data.unavailable) {
    return {
      label: `${provider.label} —`,
      title: data.detail ?? `${provider.label} credits unavailable. Click to open billing.`,
      warn: true
    };
  }
  const amount = provider.formatCredits(data);
  if (amount === "N/A") {
    return {
      label: `${provider.label} —`,
      title: `${provider.label} credits unavailable. Click to open billing.`,
      warn: true
    };
  }
  return {
    label: `${provider.label} ${amount}`,
    title: `${provider.label}: ${amount} remaining. Click to top up.`,
    warn: false
  };
}

const openBilling = (url: string): void => {
  window.open(url, "_blank", "noopener,noreferrer");
};

/**
 * Status-strip credits for user-connected FAL / KIE / AtlasCloud keys.
 * Hidden when none of those secrets are configured.
 */
const ProviderCreditsBar = memo(function ProviderCreditsBar() {
  const theme = useTheme();
  const fetchSecrets = useSecretsStore((s) => s.fetchSecrets);
  const secrets = useSecretsStore((s) => s.secrets);

  useEffect(() => {
    void fetchSecrets();
  }, [fetchSecrets]);

  const providers = useMemo(
    () => connectedCreditProviders(secrets),
    [secrets]
  );

  const { balances, loading, refresh } = useProviderCredits(providers);

  if (providers.length === 0) {
    return null;
  }

  return (
    <FlexRow
      align="center"
      gap={SPACING.md}
      className="provider-credits-bar"
      aria-label="Provider credits"
      sx={{
        flexShrink: 0,
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums"
      }}
    >
      {providers.map((provider) => {
        const { label, title, warn } = formatEntry(
          provider,
          balances[provider.id]
        );
        return (
          <Tooltip
            key={provider.id}
            title={title}
            placement="top"
            delay={TOOLTIP_ENTER_DELAY}
          >
            <button
              type="button"
              className="provider-credits-chip"
              onClick={() => openBilling(provider.billingUrl)}
              aria-label={title}
              style={{
                appearance: "none",
                background: "transparent",
                border: "none",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                font: "inherit",
                color: warn
                  ? theme.vars.palette.warning.main
                  : theme.vars.palette.text.secondary
              }}
            >
              {label}
            </button>
          </Tooltip>
        );
      })}
      <RefreshButton
        tooltip="Refresh provider credits"
        isLoading={loading}
        onClick={(e) => {
          e.stopPropagation();
          refresh();
        }}
        buttonSize="small"
        sx={{
          width: CONTROL.height.xs,
          height: CONTROL.height.xs,
          padding: 0,
          color: theme.vars.palette.text.disabled,
          "&:hover": { color: theme.vars.palette.text.secondary }
        }}
      />
    </FlexRow>
  );
});

export default ProviderCreditsBar;
