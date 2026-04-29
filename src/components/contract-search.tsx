"use client";

import { useState, FormEvent } from "react";

interface Props {
  onSearch: (contractId: string) => void;
  loading?: boolean;
}

export function ContractSearch({ onSearch, loading = false }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter contract ID (C...)"
        className="flex-1 px-4 py-2 bg-neutral-900 border border-neutral-700 rounded text-sm focus:outline-none focus:border-neutral-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="px-4 py-2 bg-neutral-200 text-neutral-900 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Loading..." : "Load"}
      </button>
    </form>
  );
}
