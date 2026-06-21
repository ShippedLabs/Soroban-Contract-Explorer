"use client";

import { useMemo, useState } from "react";
import type { ContractFunction } from "@/types/contract";

interface Props {
  functions: ContractFunction[];
  selected?: string | null;
  onSelect: (name: string) => void;
}

function formatSignature(fn: ContractFunction): string {
  const params = fn.params.map((p) => `${p.name}: ${p.type}`).join(", ");
  return `${fn.name}(${params}) -> ${fn.returnType}`;
}

export function FunctionList({ functions, selected, onSelect }: Props) {
  const [filter, setFilter] = useState("");
  const normalizedFilter = filter.trim().toLowerCase();
  const filteredFunctions = useMemo(
    () =>
      normalizedFilter
        ? functions.filter((fn) =>
            fn.name.toLowerCase().includes(normalizedFilter),
          )
        : functions,
    [functions, normalizedFilter],
  );

  if (functions.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No functions found in this contract.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filter functions"
        aria-label="Filter functions"
        className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
      />

      {filteredFunctions.length === 0 ? (
        <p className="rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-500">
          No functions match this filter.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {filteredFunctions.map((fn) => {
            const isSelected = fn.name === selected;
            return (
              <li key={fn.name}>
                <button
                  onClick={() => onSelect(fn.name)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-mono border transition-colors ${
                    isSelected
                      ? "bg-neutral-800 border-neutral-600 text-neutral-100"
                      : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                  }`}
                >
                  {formatSignature(fn)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
