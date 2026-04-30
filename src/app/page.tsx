"use client";

import { ContractSearch } from "@/components/contract-search";
import { FunctionList } from "@/components/function-list";
import { useContract } from "@/hooks/use-contract";

export default function Home() {
  const {
    metadata,
    loading,
    error,
    selectedName,
    selectFunction,
    load,
  } = useContract();

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
          <ContractSearch onSearch={load} loading={loading} />
        </section>

        <section>
          {error && <p className="text-sm text-red-400">{error}</p>}

          {!error && !metadata && !loading && (
            <p className="text-sm text-neutral-500">No contract loaded yet.</p>
          )}

          {metadata && (
            <div>
              <p className="text-xs text-neutral-500 mb-3 font-mono break-all">
                {metadata.contractId}
              </p>
              <FunctionList
                functions={metadata.functions}
                selected={selectedName}
                onSelect={selectFunction}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
