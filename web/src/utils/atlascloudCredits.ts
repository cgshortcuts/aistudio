import { BASE_URL } from "../stores/BASE_URL";

/** AtlasCloud console — API keys. */
export const ATLASCLOUD_API_KEYS_URL =
  "https://www.atlascloud.ai/console/api-keys";

/** AtlasCloud billing / top-up page. */
export const ATLASCLOUD_BILLING_URL =
  "https://www.atlascloud.ai/console/billing";

/** Whether to show an API-key link for this error (skip network-only copy). */
export function atlascloudCreditsDetailSuggestsKeysLink(
  detail: string | undefined,
): boolean {
  if (detail == null || detail.trim() === "") {
    return false;
  }
  const d = detail.toLowerCase();
  if (d.includes("reach atlascloud") || d.includes("try again later")) {
    return false;
  }
  return true;
}

export interface AtlascloudCredits {
  credit_balance?: { amount?: number; currency?: string } | number;
  /** Set by our API when AtlasCloud account fetch fails (HTTP 200). */
  unavailable?: boolean;
  detail?: string;
}

export function formatAtlascloudCredits(data: AtlascloudCredits): string {
  const bal = data.credit_balance;
  if (bal == null) {
    return "N/A";
  }
  if (typeof bal === "number") {
    return `$${bal.toFixed(2)}`;
  }
  if (typeof bal === "object") {
    const amount = bal.amount;
    const currency = (bal.currency ?? "USD").toUpperCase();
    if (typeof amount === "number") {
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        }).format(amount);
      } catch {
        return `${amount} ${currency}`;
      }
    }
  }
  return "N/A";
}

export async function fetchAtlascloudCredits(): Promise<AtlascloudCredits | null> {
  const url = `${BASE_URL}/api/atlascloud/credits`;
  try {
    const res = await fetch(url);
    if (res.status === 204) {
      console.info(
        "[atlascloud-credits] server 204 — no ATLASCLOUD_API_KEY configured on backend",
      );
      return null;
    }
    if (!res.ok) {
      console.warn("[atlascloud-credits] request failed", {
        url,
        status: res.status,
      });
      return null;
    }
    const data = (await res.json()) as AtlascloudCredits;
    if (data.unavailable) {
      console.info(
        "[atlascloud-credits] backend returned unavailable:",
        data.detail ?? "",
      );
    } else {
      console.info(
        "[atlascloud-credits] ok — credit display:",
        formatAtlascloudCredits(data),
      );
    }
    return data;
  } catch (err) {
    console.warn("[atlascloud-credits] fetch error", err);
    return null;
  }
}
