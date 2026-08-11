/**
 * Persist an AtlasCloud composer / direct-gen call onto the prediction
 * ledger so it shows on the Costs page. Workflow nodes go through
 * `reportAtlasCloudCost` on the processing context instead.
 */

import { Prediction } from "@nodetool-ai/models";
import { createLogger } from "@nodetool-ai/config";
import { estimateAtlasCloudCost } from "@nodetool-ai/atlascloud-nodes/cost";

const log = createLogger("nodetool.websocket.atlascloud-cost");

export async function persistAtlasCloudMediaCost(input: {
  userId: string;
  providerId: string;
  modelId: string;
  workflowId: string | null;
  args?: Record<string, unknown>;
}): Promise<void> {
  if (input.providerId !== "atlascloud" || !input.modelId) {
    return;
  }
  try {
    const estimate = estimateAtlasCloudCost(input.modelId, input.args ?? {});
    if (!estimate || estimate.cost <= 0) {
      return;
    }
    await Prediction.create<Prediction>({
      user_id: input.userId,
      provider: "atlascloud",
      model: estimate.model,
      node_type: "atlascloud.media",
      cost: estimate.cost,
      currency: estimate.currency,
      billing_unit: estimate.billingUnit,
      quantity: estimate.quantity,
      unit_price: estimate.unitPrice,
      workflow_id: input.workflowId,
      node_id: "",
      status: "completed"
    });
  } catch (err) {
    log.warn("Failed to persist AtlasCloud media cost", {
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
