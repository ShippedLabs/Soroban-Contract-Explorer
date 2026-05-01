"use client";

import { useState, useEffect, FormEvent } from "react";
import type { ContractFunction, FunctionParam } from "@/types/contract";

interface Props {
  fn: ContractFunction;
  walletConnected: boolean;
  loading: boolean;
  onSimulate: (values: Record<string, string>) => void;
  onInvoke: (values: Record<string, string>) => void;
}

function placeholderFor(param: FunctionParam): string {
  switch (param.type) {
    case "Address":
      return "G... or C...";
    case "U32":
    case "I32":
    case "U64":
    case "I64":
    case "U128":
    case "I128":
      return "number";
    case "Bool":
      return "true / false";
    case "Bytes":
      return "hex string (no 0x)";
    case "Vec":
      return `comma-separated ${param.inner ?? "values"}`;
    case "Option":
      return `${param.inner ?? "value"} (leave blank for None)`;
    default:
      return param.type;
  }
}

export function FunctionForm({
  fn,
  walletConnected,
  loading,
  onSimulate,
  onInvoke,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    fn.params.forEach((p) => (initial[p.name] = ""));
    setValues(initial);
  }, [fn]);

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSimulate = (e: FormEvent) => {
    e.preventDefault();
    onSimulate(values);
  };

  const handleInvoke = () => {
    onInvoke(values);
  };

  return (
    <form
      onSubmit={handleSimulate}
      className="border border-neutral-800 rounded p-4 bg-neutral-950"
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-mono text-neutral-200">{fn.name}</h2>
        <span className="text-xs text-neutral-500">
          returns {fn.returnType}
        </span>
      </div>

      {fn.params.length === 0 ? (
        <p className="text-xs text-neutral-500 mb-4">No parameters.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-4">
          {fn.params.map((p) => (
            <label key={p.name} className="flex flex-col gap-1">
              <span className="text-xs text-neutral-400 font-mono">
                {p.name}: {p.type}
                {p.inner ? `<${p.inner}>` : ""}
              </span>
              <input
                type="text"
                value={values[p.name] ?? ""}
                onChange={(e) => handleChange(p.name, e.target.value)}
                placeholder={placeholderFor(p)}
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-sm font-mono focus:outline-none focus:border-neutral-500"
                disabled={loading}
              />
            </label>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-neutral-200 rounded text-xs font-medium disabled:opacity-50"
        >
          {loading ? "Running..." : "Simulate"}
        </button>
        <button
          type="button"
          onClick={handleInvoke}
          disabled={loading || !walletConnected}
          title={
            !walletConnected
              ? "Connect a wallet to submit"
              : "Submit transaction"
          }
          className="px-3 py-1.5 bg-neutral-200 text-neutral-900 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
