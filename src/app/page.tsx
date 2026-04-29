"use client";

import { ContractSearch } from "@/components/contract-search";

export default function Home() {
  const handleSearch = (contractId: string) => {
    console.log("Search for:", contractId);
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
          <ContractSearch onSearch={handleSearch} />
        </section>

        <section className="text-sm text-neutral-500">
          No contract loaded yet.
        </section>
      </div>
    </main>
  );
}
