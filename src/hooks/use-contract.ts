"use client";

import { useState, useCallback } from "react";
import { loadContractMetadata } from "@/lib/contract-parser";
import type { ContractMetadata, ContractFunction } from "@/types/contract";

export function useContract() {
  const [metadata, setMetadata] = useState<ContractMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const load = useCallback(async (contractId: string) => {
    setLoading(true);
    setError(null);
    setMetadata(null);
    setSelectedName(null);

    try {
      const data = await loadContractMetadata(contractId);
      setMetadata(data);
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
    load,
    selectFunction,
  };
}
