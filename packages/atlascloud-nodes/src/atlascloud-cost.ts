/**
 * Estimated cost tracking for AtlasCloud nodes.
 *
 * AtlasCloud has no per-request billing API. Prices come from the GenSpend
 * catalog via `getModelUnitPrice` (same lookup the editor estimate uses).
 * Quantity is inferred from the request: image count, or video duration when
 * the unit is seconds. These are estimates — not invoiced charges.
 */

import { getModelUnitPrice } from "@nodetool-ai/model-pricing";

export interface AtlasCloudCostEstimate {
  provider: "atlascloud";
  model: string;
  cost: number;
  unitPrice: number;
  quantity: number;
  billingUnit: string;
  currency: string;
}

function finiteNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function leadingNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function isVagueBillingUnit(unit: string): boolean {
  return /\bunits?\b|\bcredits?\b/i.test(unit.trim());
}

/**
 * How many billing units a call consumed. Falls back to 1 when the unit is
 * not observable from the request (or duration is the model's auto choice).
 */
export function inferAtlasCloudQuantity(
  billingUnit: string,
  args: Record<string, unknown> = {}
): number {
  const unit = billingUnit.trim().toLowerCase();

  if (unit === "images" || unit === "image") {
    const n =
      finiteNumber(args.variations) ??
      finiteNumber(args.num_images) ??
      finiteNumber(args.num_outputs);
    return n != null && n > 0 ? n : 1;
  }

  if (unit.includes("second") && !unit.includes("compute")) {
    const secs =
      leadingNumber(args.duration) ??
      leadingNumber(args.durationSeconds) ??
      leadingNumber(args.duration_seconds) ??
      leadingNumber(args.seconds);
    // AtlasCloud uses -1 to mean "model chooses"; that is not a billed length.
    if (secs == null || secs <= 0) {
      return 1;
    }
    return secs;
  }

  return 1;
}

export function estimateAtlasCloudCost(
  modelId: string,
  args: Record<string, unknown> = {}
): AtlasCloudCostEstimate | null {
  const price = getModelUnitPrice({ id: modelId, provider: "atlascloud" });
  if (!price || !Number.isFinite(price.unit_price)) {
    return null;
  }
  if (isVagueBillingUnit(price.billing_unit)) {
    return null;
  }

  const quantity = inferAtlasCloudQuantity(price.billing_unit, args);
  return {
    provider: "atlascloud",
    model: modelId,
    cost: Math.round(price.unit_price * quantity * 1e8) / 1e8,
    unitPrice: price.unit_price,
    quantity,
    billingUnit: price.billing_unit,
    currency: price.currency || "USD"
  };
}

type ProviderCostSetter = (
  provider: string,
  amount: number,
  unit: string,
  details?: {
    model?: string | null;
    billing_unit?: string | null;
    quantity?: number | null;
    unit_price?: number | null;
    currency?: string | null;
    provider_request_id?: string | null;
  }
) => void;

/**
 * Report an AtlasCloud call's GenSpend estimate onto the processing context
 * so the runner persists it to the prediction ledger. No-op when the model
 * is unpriced or the context cannot receive provider costs.
 */
export function reportAtlasCloudCost(
  context: unknown,
  modelId: string,
  args: Record<string, unknown> = {},
  requestId: string | null = null
): void {
  const setter = (context as { setProviderCost?: unknown } | null | undefined)
    ?.setProviderCost;
  if (typeof setter !== "function") {
    return;
  }

  const estimate = estimateAtlasCloudCost(modelId, args);
  if (!estimate) {
    return;
  }

  (setter as ProviderCostSetter).call(
    context,
    "atlascloud",
    estimate.cost,
    estimate.currency,
    {
      model: estimate.model,
      billing_unit: estimate.billingUnit,
      quantity: estimate.quantity,
      unit_price: estimate.unitPrice,
      currency: estimate.currency,
      provider_request_id: requestId
    }
  );
}
