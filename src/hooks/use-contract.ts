"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { loadContractMetadata } from "@/lib/contract-parser";
import type { ContractMetadata, ContractFunction } from "@/types/contract";
import type { StellarNetwork } from "@/lib/stellar-client";

export function useContract() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryFn = searchParams.get("fn");

  const [metadata, setMetadata] = useState<ContractMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [network, setNetwork] = useState<StellarNetwork | null>(null);

  const load = useCallback(async (contractId: string, targetNetwork: StellarNetwork) => {
    setLoading(true);
    setError(null);
    setMetadata(null);
    setSelectedName(null);
    setNetwork(null);

    try {
      const data = await loadContractMetadata(contractId, targetNetwork);
      setMetadata(data);
      setNetwork(targetNetwork);

      const targetPath = `/contract/${contractId}`;
      if (pathname !== targetPath) {
        const params = new URLSearchParams();
        params.set("network", targetNetwork);
        if (queryFn) {
          params.set("fn", queryFn);
        }
        router.push(`${targetPath}?${params.toString()}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contract");
    } finally {
      setLoading(false);
    }
  }, [pathname, router, queryFn]);

  // Sync selectedName with fn query parameter
  useEffect(() => {
    if (metadata) {
      if (queryFn && metadata.functions.some((f) => f.name === queryFn)) {
        setSelectedName(queryFn);
      } else if (!queryFn) {
        setSelectedName(null);
      }
    }
  }, [metadata, queryFn]);

  const selectFunction = useCallback((name: string) => {
    setSelectedName(name);
    const params = new URLSearchParams(searchParams.toString());
    params.set("fn", name);
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, searchParams, router]);

  const patchFunctionReadOnly = useCallback(
    (name: string, isReadOnly: boolean) => {
      setMetadata((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          functions: prev.functions.map((f) =>
            f.name === name ? { ...f, isReadOnly } : f
          ),
        };
      });
    },
    []
  );

  const selectedFunction: ContractFunction | null =
    metadata?.functions.find((f) => f.name === selectedName) ?? null;

  return {
    metadata,
    loading,
    error,
    selectedName,
    selectedFunction,
    network,
    load,
    selectFunction,
    patchFunctionReadOnly,
  };
}

