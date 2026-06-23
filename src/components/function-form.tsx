"use client";

import { useState, useEffect, FormEvent } from "react";
import type { ContractFunction, FunctionParam } from "@/types/contract";
import { validateValue } from "@/lib/validators";

interface Props {
  fn: ContractFunction;
  walletConnected: boolean;
  loading: boolean;
  onSimulate: (values: Record<string, string>) => void;
  onInvoke: (values: Record<string, string>) => void;
  onClear: () => void;
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
  onClear,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    fn.params.forEach((p) => (initial[p.name] = ""));
    setValues(initial);
    setErrors({});
  }, [fn]);

  const handleChange = (param: FunctionParam, value: string) => {
    setValues((prev) => ({ ...prev, [param.name]: value }));
    setErrors((prev) => ({
      ...prev,
      [param.name]: validateValue(value, param.type, param.inner),
    }));
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const isEmpty = Object.values(values).every((v) => v === "");

  const handleClear = () => {
    const reset: Record<string, string> = {};
    fn.params.forEach((p) => (reset[p.name] = ""));
    setValues(reset);
    setErrors({});
    onClear();
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
                onChange={(e) => handleChange(p, e.target.value)}
                placeholder={placeholderFor(p)}
                className={`px-3 py-1.5 bg-neutral-900 border rounded text-sm font-mono focus:outline-none focus:border-neutral-500 ${
                  errors[p.name]
                    ? "border-red-700"
                    : "border-neutral-700"
                }`}
                disabled={loading}
              />
              {errors[p.name] && (
                <span className="text-xs text-red-400">{errors[p.name]}</span>
              )}
            </label>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || hasErrors}
          className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-neutral-200 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Running..." : "Simulate"}
        </button>
        <button
          type="button"
          onClick={handleInvoke}
          disabled={loading || hasErrors || !walletConnected}
          title={
            !walletConnected
              ? "Connect a wallet to submit"
              : "Submit transaction"
          }
          className="px-3 py-1.5 bg-neutral-200 text-neutral-900 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={loading || isEmpty}
          className="px-3 py-1.5 bg-transparent border border-neutral-700 text-neutral-400 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:text-neutral-200 hover:border-neutral-500 transition-colors"
        >
          Clear
        </button>
      </div>
    </form>
  );
}