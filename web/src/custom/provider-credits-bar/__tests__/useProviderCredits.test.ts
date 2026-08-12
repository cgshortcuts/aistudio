import { act, renderHook, waitFor } from "@testing-library/react";
import { useProviderCredits } from "../useProviderCredits";
import type { CreditProviderDef } from "../creditProviders";

function makeProvider(
  id: "fal" | "kie" | "atlascloud",
  fetchCredits: CreditProviderDef["fetchCredits"],
): CreditProviderDef {
  return {
    id,
    secretKey: `${id.toUpperCase()}_KEY`,
    label: id,
    billingUrl: `https://example.com/${id}`,
    fetchCredits,
    formatCredits: () => "$1.00",
  };
}

describe("useProviderCredits", () => {
  it("loads balances for connected providers", async () => {
    const fal = makeProvider("fal", async () => ({
      credit_balance: { amount: 10, currency: "USD" },
    }));
    const { result } = renderHook(() => useProviderCredits([fal]));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.balances.fal).toEqual({
      status: "ready",
      data: { credit_balance: { amount: 10, currency: "USD" } },
    });
  });

  it("marks null fetch results as empty", async () => {
    const kie = makeProvider("kie", async () => null);
    const { result } = renderHook(() => useProviderCredits([kie]));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.balances.kie).toEqual({ status: "empty" });
  });

  it("refresh re-fetches", async () => {
    let calls = 0;
    const fal = makeProvider("fal", async () => {
      calls += 1;
      return { credit_balance: { amount: calls, currency: "USD" } };
    });
    const { result } = renderHook(() => useProviderCredits([fal]));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(calls).toBe(1);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.balances.fal).toEqual({
        status: "ready",
        data: { credit_balance: { amount: 2, currency: "USD" } },
      });
    });
    expect(calls).toBe(2);
  });

  it("clears balances when providers become empty", async () => {
    const fal = makeProvider("fal", async () => ({
      credit_balance: { amount: 1, currency: "USD" },
    }));
    const { result, rerender } = renderHook(
      ({ providers }) => useProviderCredits(providers),
      { initialProps: { providers: [fal] } },
    );

    await waitFor(() => {
      expect(result.current.balances.fal?.status).toBe("ready");
    });

    rerender({ providers: [] });

    await waitFor(() => {
      expect(result.current.balances).toEqual({});
      expect(result.current.loading).toBe(false);
    });
  });
});
