import {
  FAL_BILLING_URL,
  fetchFalCredits,
  formatCredits,
  type FalCredits,
} from "../../utils/falCredits";
import {
  KIE_BILLING_URL,
  fetchKieCredits,
  formatKieCredits,
  type KieCredits,
} from "../../utils/kieCredits";
import {
  ATLASCLOUD_BILLING_URL,
  fetchAtlascloudCredits,
  formatAtlascloudCredits,
  type AtlascloudCredits,
} from "../../utils/atlascloudCredits";

export type ProviderCreditsId = "fal" | "kie" | "atlascloud";

export type ProviderCreditsPayload =
  | FalCredits
  | KieCredits
  | AtlascloudCredits;

export interface CreditProviderDef {
  id: ProviderCreditsId;
  /** Secret key that marks this provider as user-connected. */
  secretKey: string;
  /** Short label in the status strip. */
  label: string;
  billingUrl: string;
  fetchCredits: () => Promise<ProviderCreditsPayload | null>;
  formatCredits: (data: ProviderCreditsPayload) => string;
}

export const CREDIT_PROVIDERS: readonly CreditProviderDef[] = [
  {
    id: "fal",
    secretKey: "FAL_API_KEY",
    label: "FAL",
    billingUrl: FAL_BILLING_URL,
    fetchCredits: fetchFalCredits,
    formatCredits: (data) => formatCredits(data as FalCredits),
  },
  {
    id: "kie",
    secretKey: "KIE_API_KEY",
    label: "KIE",
    billingUrl: KIE_BILLING_URL,
    fetchCredits: fetchKieCredits,
    formatCredits: (data) => formatKieCredits(data as KieCredits),
  },
  {
    id: "atlascloud",
    secretKey: "ATLASCLOUD_API_KEY",
    label: "Atlas",
    billingUrl: ATLASCLOUD_BILLING_URL,
    fetchCredits: fetchAtlascloudCredits,
    formatCredits: (data) => formatAtlascloudCredits(data as AtlascloudCredits),
  },
];

export function connectedCreditProviders(
  secrets: ReadonlyArray<{ key: string; is_configured: boolean }>,
): CreditProviderDef[] {
  const configured = new Set(
    secrets.filter((s) => s.is_configured).map((s) => s.key),
  );
  return CREDIT_PROVIDERS.filter((p) => configured.has(p.secretKey));
}
