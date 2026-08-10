import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertBanner, FlexColumn, Text, TextLink } from "../ui_primitives";
import {
  CODE_AUTHORING_SOURCE_LABEL,
  type SkippedCodeAuthoringCandidate
} from "../../hooks/useCodeAuthoringModel";
import { openSettingsPage } from "../../utils/openSettingsPage";

export interface CodeAuthoringModelNoticeProps {
  /** Candidates the resolver passed over, for the explanation line. */
  skipped?: readonly SkippedCodeAuthoringCandidate[];
  className?: string;
}

function describe(candidate: SkippedCodeAuthoringCandidate): string {
  const label = CODE_AUTHORING_SOURCE_LABEL[candidate.source];
  const name = candidate.model.name || candidate.model.id;
  const reason =
    candidate.reason === "no_tool_support"
      ? "no tool support"
      : "not available";
  return `${label}: ${name} (${reason})`;
}

/**
 * Shown when no tool-capable model resolves for code generation. Code arrives
 * as a tool call, so a model without tool support cannot author it.
 */
function CodeAuthoringModelNotice({
  skipped,
  className
}: CodeAuthoringModelNoticeProps) {
  const navigate = useNavigate();

  const handleOpenSettings = useCallback(() => {
    openSettingsPage({ tab: 0, navigate });
  }, [navigate]);

  return (
    <AlertBanner
      className={className}
      severity="warning"
      title="No model available for code generation"
      role="alert"
    >
      <FlexColumn gap={1}>
        <Text>
          Code generation needs a model that supports tool calling. Pick one
          under Default Models &rarr; Code Generation.
        </Text>
        {skipped && skipped.length > 0 && (
          <FlexColumn gap={0.5}>
            {skipped.map((candidate) => (
              <Text
                key={`${candidate.source}-${candidate.model.id}`}
                size="small"
                color="secondary"
              >
                {describe(candidate)}
              </Text>
            ))}
          </FlexColumn>
        )}
        <TextLink asButton onClick={handleOpenSettings}>
          Open Settings
        </TextLink>
      </FlexColumn>
    </AlertBanner>
  );
}

export default memo(CodeAuthoringModelNotice);
