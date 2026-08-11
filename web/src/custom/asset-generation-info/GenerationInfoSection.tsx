/** @jsxImportSource @emotion/react */
import { memo, useMemo } from "react";
import type { Asset } from "../../stores/ApiTypes";
import { CopyableInfoRow } from "./CopyableInfoRow";
import { buildGenerationInfoRows } from "./generationMetadataRows";

interface GenerationInfoSectionProps {
  asset: Asset;
}

/**
 * Generation + file-location rows for the asset info panel.
 * Returns null when there is nothing generation-related to show.
 */
export const GenerationInfoSection = memo(function GenerationInfoSection({
  asset
}: GenerationInfoSectionProps) {
  const rows = useMemo(() => buildGenerationInfoRows(asset), [asset]);
  if (rows.length === 0) return null;
  return (
    <div className="info-section">
      {rows.map((row) => (
        <CopyableInfoRow key={`${row.label}:${row.value}`} row={row} />
      ))}
    </div>
  );
});
