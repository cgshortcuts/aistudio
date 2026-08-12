/**
 * Integration tests for the AtlasCloud credits route.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";

vi.mock("@nodetool-ai/models", async (orig) => {
  const actual = await orig<typeof import("@nodetool-ai/models")>();
  return {
    ...actual,
    Secret: {
      find: vi.fn(),
    },
  };
});

import { Secret } from "@nodetool-ai/models";
import atlascloudCreditsRoute from "../src/routes/atlascloud-credits.js";

type MockSecret = { getDecryptedValue: () => Promise<string> };
const secretFind = Secret.find as unknown as ReturnType<typeof vi.fn>;

function mockSecret(apiKey: string | null): void {
  if (apiKey === null) {
    secretFind.mockResolvedValue(null);
    return;
  }
  const stub: MockSecret = {
    getDecryptedValue: vi.fn().mockResolvedValue(apiKey),
  };
  secretFind.mockResolvedValue(stub);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let prevAtlasKey: string | undefined;

beforeEach(() => {
  prevAtlasKey = process.env.ATLASCLOUD_API_KEY;
  delete process.env.ATLASCLOUD_API_KEY;
  secretFind.mockReset();
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  if (prevAtlasKey === undefined) {
    delete process.env.ATLASCLOUD_API_KEY;
  } else {
    process.env.ATLASCLOUD_API_KEY = prevAtlasKey;
  }
  vi.restoreAllMocks();
});

describe("GET /api/atlascloud/credits", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify({ logger: false });
    await app.register(atlascloudCreditsRoute);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns 204 when no ATLASCLOUD_API_KEY is configured", async () => {
    mockSecret(null);
    const res = await app.inject({
      method: "GET",
      url: "/api/atlascloud/credits",
    });
    expect(res.statusCode).toBe(204);
  });

  it("normalizes AtlasCloud balance into credit_balance", async () => {
    mockSecret("atlas-key-123");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        object: "balance",
        available: { value: "125.500000", currency: "usd" },
      }),
    );

    const res = await app.inject({
      method: "GET",
      url: "/api/atlascloud/credits",
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("api.atlascloud.ai/public/v1/balance");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer atlas-key-123",
    );

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toEqual({
      credit_balance: { amount: 125.5, currency: "USD" },
    });
  });

  it("returns unavailable when AtlasCloud responds 401", async () => {
    mockSecret("atlas-key-bad");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        {
          error: {
            type: "authentication_error",
            message: "Invalid API key",
          },
        },
        401,
      ),
    );

    const res = await app.inject({
      method: "GET",
      url: "/api/atlascloud/credits",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.unavailable).toBe(true);
    expect(body.credit_balance).toBeNull();
    expect(String(body.detail)).toMatch(/invalid api key/i);
  });

  it("returns unavailable on network error", async () => {
    mockSecret("atlas-key-net");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const res = await app.inject({
      method: "GET",
      url: "/api/atlascloud/credits",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.unavailable).toBe(true);
    expect(body.credit_balance).toBeNull();
    expect(String(body.detail)).toMatch(/could not reach atlascloud/i);
  });

  it("falls back to ATLASCLOUD_API_KEY env when no secret exists", async () => {
    mockSecret(null);
    process.env.ATLASCLOUD_API_KEY = "env-atlas-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        available: { value: "10", currency: "usd" },
      }),
    );

    const res = await app.inject({
      method: "GET",
      url: "/api/atlascloud/credits",
    });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer env-atlas-key",
    );
    expect(res.statusCode).toBe(200);
  });
});
