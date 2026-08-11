import type { NodeMetadata } from "../stores/ApiTypes";
import atlascloudManifest from "@nodetool/atlascloud-manifest";
import { genspendPricingCatalog } from "@nodetool-ai/model-pricing/genspend-catalog";
import { getModelUnitPrice } from "./modelUnitPricing";

interface AtlasManifestRow {
  className: string;
  moduleName: string;
  modelId: string;
}

function isManifestRow(value: unknown): value is AtlasManifestRow {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.className === "string" &&
    typeof row.moduleName === "string" &&
    typeof row.modelId === "string"
  );
}

/**
 * Attaches GenSpend list prices onto dedicated AtlasCloud node metadata.
 * Those nodes bake the model into the type, so they have no provider-model
 * property for the generic estimator path.
 */
export const attachAtlasCloudUnitPricing = (
  metadataByType: Record<string, NodeMetadata>
): void => {
  if (!Array.isArray(atlascloudManifest)) {
    return;
  }
  const checkedAt = genspendPricingCatalog.updatedAt;

  for (const entry of atlascloudManifest) {
    if (!isManifestRow(entry)) {
      continue;
    }
    const nodeType = `atlascloud.${entry.moduleName}.${entry.className}`;
    const md = metadataByType[nodeType];
    if (!md) {
      continue;
    }
    if (md.atlascloud_unit_pricing?.source === "live") {
      continue;
    }
    const hasDate =
      md.atlascloud_unit_pricing?.checked_at != null &&
      String(md.atlascloud_unit_pricing.checked_at).trim() !== "";
    if (hasDate) {
      continue;
    }

    const price = getModelUnitPrice({
      id: entry.modelId,
      provider: "atlascloud"
    });
    if (!price || !Number.isFinite(price.unit_price)) {
      continue;
    }

    md.atlascloud_unit_pricing = {
      model_id: entry.modelId,
      unit_price: price.unit_price,
      billing_unit: price.billing_unit,
      currency: price.currency,
      source: "bundle",
      checked_at: checkedAt
    };
  }
};
