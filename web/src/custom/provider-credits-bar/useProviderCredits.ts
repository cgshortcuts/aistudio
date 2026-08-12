import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CreditProviderDef,
  ProviderCreditsId,
  ProviderCreditsPayload,
} from "./creditProviders";

export type ProviderCreditsEntry =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error" }
  | {
      status: "ready";
      data: ProviderCreditsPayload;
    };

export type ProviderCreditsMap = Partial<
  Record<ProviderCreditsId, ProviderCreditsEntry>
>;

/**
 * Fetch balances for the given connected credit providers.
 * Loads once when the provider set changes; call `refresh` to refetch.
 */
export function useProviderCredits(
  providers: readonly CreditProviderDef[],
): {
  balances: ProviderCreditsMap;
  loading: boolean;
  refresh: () => void;
} {
  const [balances, setBalances] = useState<ProviderCreditsMap>({});
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const genRef = useRef(0);
  const providersRef = useRef(providers);
  providersRef.current = providers;

  const providerKey = providers.map((p) => p.id).join(",");

  useEffect(() => {
    const list = providersRef.current;
    if (list.length === 0) {
      setBalances({});
      setLoading(false);
      return;
    }

    const gen = ++genRef.current;
    setLoading(true);
    setBalances(
      Object.fromEntries(
        list.map((p) => [p.id, { status: "loading" as const }]),
      ),
    );

    void (async () => {
      const results = await Promise.all(
        list.map(async (p) => {
          try {
            const data = await p.fetchCredits();
            return { id: p.id, data } as const;
          } catch {
            return { id: p.id, data: null } as const;
          }
        }),
      );

      if (gen !== genRef.current) {
        return;
      }

      const next: ProviderCreditsMap = {};
      for (const { id, data } of results) {
        if (data == null) {
          next[id] = { status: "empty" };
        } else {
          next[id] = { status: "ready", data };
        }
      }
      setBalances(next);
      setLoading(false);
    })();
  }, [providerKey, refreshToken]);

  const refresh = useCallback(() => {
    setRefreshToken((n) => n + 1);
  }, []);

  return { balances, loading, refresh };
}
