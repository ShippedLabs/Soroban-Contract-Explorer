"use client";

import { useState, useCallback } from "react";
import { loadContractMetadata } from "@/lib/contract-parser";
import type { ContractMetadata, ContractFunction } from "@/types/contract";
import type { StellarNetwork } from "@/lib/stellar-client";

export function useContract() {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contract");
    } finally {
      setLoading(false);
    }
  }, []);

  const selectFunction = useCallback((name: string) => {
    setSelectedName(name);
  }, []);

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
  };
}
