import type { FastifyPluginAsync } from "fastify";
import { Secret } from "@nodetool-ai/models";

/** Public account balance (USD cash + bonus). Docs: /docs/en/public-api/balance */
const ATLASCLOUD_BALANCE_URL = "https://api.atlascloud.ai/public/v1/balance";

interface AtlasMoney {
  value?: string | number;
  currency?: string;
}

interface AtlasBalanceJson {
  available?: AtlasMoney;
  credit_balance?: unknown;
}

function parseAmount(value: string | number | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return null;
}

/** UI expects `credit_balance: { amount, currency }` (same shape as FAL/KIE). */
function normalizeAtlasCreditsBody(data: unknown): Record<string, unknown> {
  if (data == null || typeof data !== "object") {
    return { credit_balance: null };
  }
  const d = data as AtlasBalanceJson;
  const amount = parseAmount(d.available?.value);
  if (amount != null) {
    return {
      credit_balance: {
        amount,
        currency: (d.available?.currency ?? "USD").toUpperCase(),
      },
    };
  }
  if (d.credit_balance != null) {
    return { ...d } as Record<string, unknown>;
  }
  return { credit_balance: null };
}

function atlasErrorDetail(body: string, httpStatus: number): string {
  try {
    const j = JSON.parse(body) as {
      error?: { message?: string };
      message?: string;
    };
    const msg = j.error?.message ?? j.message;
    if (typeof msg === "string" && msg.trim() !== "") {
      return msg.trim();
    }
  } catch {
    // not JSON
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return "Unauthorized. Check ATLASCLOUD_API_KEY in settings.";
  }
  if (httpStatus === 402) {
    return "Insufficient balance on your AtlasCloud account.";
  }
  return "AtlasCloud balance could not be loaded. Check ATLASCLOUD_API_KEY in settings.";
}

const atlascloudCreditsRoute: FastifyPluginAsync = async (app) => {
  app.get("/api/atlascloud/credits", async (_req, reply) => {
    const secret = await Secret.find("1", "ATLASCLOUD_API_KEY");
    let apiKey: string | null = null;
    if (secret) {
      try {
        apiKey = await secret.getDecryptedValue();
      } catch (err) {
        console.error("[atlascloud-credits] decryption failed:", err);
      }
    }
    apiKey ??= process.env.ATLASCLOUD_API_KEY ?? null;

    if (!apiKey) {
      console.info(
        "[atlascloud-credits] no ATLASCLOUD_API_KEY (db secret or env); returning 204",
      );
      reply.status(204).send();
      return;
    }

    try {
      const res = await fetch(ATLASCLOUD_BALANCE_URL, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.warn(
          "[atlascloud-credits] atlascloud HTTP",
          res.status,
          "—",
          body.slice(0, 200),
        );
        reply.send({
          unavailable: true,
          detail: atlasErrorDetail(body, res.status),
          credit_balance: null,
        });
        return;
      }

      const raw = await res.json();
      const payload = normalizeAtlasCreditsBody(raw);
      const bal = payload.credit_balance;
      console.info("[atlascloud-credits] atlascloud OK", {
        has_credit_balance: bal != null,
        balance_type: bal == null ? "none" : typeof bal,
      });
      reply.send(payload);
    } catch (err) {
      console.error("[atlascloud-credits] fetch failed:", err);
      reply.send({
        unavailable: true,
        detail: "Could not reach AtlasCloud. Try again later.",
        credit_balance: null,
      });
    }
  });
};

export default atlascloudCreditsRoute;
