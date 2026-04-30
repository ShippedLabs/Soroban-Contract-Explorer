"use client";

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
  if (functions.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No functions found in this contract.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {functions.map((fn) => {
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
  );
}
