"use client";

import { useState } from "react";
import { ContractSearch } from "@/components/contract-search";
import { fetchContractWasm } from "@/lib/contract-parser";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [wasmSize, setWasmSize] = useState<number | null>(null);

  const handleSearch = async (contractId: string) => {
    setLoading(true);
    setError(null);
    setLoadedId(null);
    setWasmSize(null);

    try {
      const wasm = await fetchContractWasm(contractId);
      setLoadedId(contractId);
      setWasmSize(wasm.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contract");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">
            Soroban Contract Explorer
          </h1>
          <p className="text-sm text-neutral-400">
            Paste a contract ID to view and call its functions.
          </p>
        </header>

        <section className="mb-8">
          <ContractSearch onSearch={handleSearch} loading={loading} />
        </section>

        <section className="text-sm">
          {error && <p className="text-red-400">{error}</p>}
          {!error && !loadedId && !loading && (
            <p className="text-neutral-500">No contract loaded yet.</p>
          )}
          {loadedId && (
            <div className="text-neutral-300">
              <p className="mb-1">Loaded contract:</p>
              <p className="font-mono text-xs break-all text-neutral-400">
                {loadedId}
              </p>
              <p className="mt-2 text-neutral-500">
                WASM size: {wasmSize} bytes
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
