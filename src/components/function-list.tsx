"use client";

import { useState } from "react";
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

  if (functions.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No functions found in this contract.
      </p>
    );
  }

  const readOnlyOrder = (fn: ContractFunction): number => {
    if (fn.isReadOnly === false) return 0;
    if (fn.isReadOnly === null) return 1;
    return 2;
  };

  const filteredFunctions = functions
    .filter((fn) => fn.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => readOnlyOrder(a) - readOnlyOrder(b));

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Filter functions..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-sm outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-600"
      />
      {filteredFunctions.length === 0 ? (
        <p className="text-sm text-neutral-500 py-2 border border-dashed border-transparent">
          No functions match your search.
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
                  <span className="flex items-center justify-between gap-2 flex-wrap">
                    <span>{formatSignature(fn)}</span>
                    {fn.isReadOnly === true && (
                      <span className="text-xs text-neutral-500 border border-neutral-700 rounded px-1 py-0.5 font-sans shrink-0">
                        read only
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
