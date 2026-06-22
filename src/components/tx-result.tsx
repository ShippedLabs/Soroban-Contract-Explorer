"use client";

import { useState } from "react";
import type { TxStatus } from "@/lib/invocation";

interface Props {
  result: unknown;
  txHash: string | null;
  error: string | null;
  network?: "testnet" | "mainnet" | null;
  txStatus?: TxStatus | null;
}

function formatValue(value: unknown): string {
  return JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard not available
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs text-neutral-500 hover:text-neutral-300"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const STATUS_LABEL: Record<TxStatus, string> = {
  submitted: "Transaction submitted — waiting for confirmation...",
  pending: "Pending — polling ledger...",
  confirmed: "Confirmed",
  failed: "Failed",
};

const STATUS_STYLE: Record<TxStatus, string> = {
  submitted: "border-blue-900 bg-blue-950/30 text-blue-300",
  pending: "border-yellow-900 bg-yellow-950/30 text-yellow-200",
  confirmed: "border-green-900 bg-green-950/30 text-green-300",
  failed: "border-red-900 bg-red-950/30 text-red-300",
};

function StatusBanner({ status }: { status: TxStatus }) {
  return (
    <div
      className={`border rounded p-3 text-xs flex items-center gap-2 ${STATUS_STYLE[status]}`}
    >
      {(status === "submitted" || status === "pending") && (
        <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {STATUS_LABEL[status]}
    </div>
  );
}

export function TxResult({ result, txHash, error, network, txStatus }: Props) {
  if (error) {
    return (
      <div className="border border-red-900 bg-red-950/30 rounded p-3 text-xs text-red-300 break-all">
        {error}
      </div>
    );
  }

  if (result === null && !txHash) {
    if (!txStatus) return null;
    return <StatusBanner status={txStatus} />;
  }

  const explorerPath = network === "mainnet" ? "public" : "testnet";
  const explorerUrl = txHash
    ? `https://stellar.expert/explorer/${explorerPath}/tx/${txHash}`
    : null;

  return (
    <div className="border border-neutral-800 rounded p-3 bg-neutral-950 flex flex-col gap-3">
      {txStatus && (txStatus === "submitted" || txStatus === "pending") && (
        <StatusBanner status={txStatus} />
      )}

      {txHash && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-neutral-500">Transaction</p>
            <div className="flex items-center gap-3">
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-400 hover:text-neutral-200"
                >
                  View on explorer
                </a>
              )}
              <CopyButton text={txHash} />
            </div>
          </div>
          <p className="text-xs font-mono text-neutral-300 break-all">
            {txHash}
          </p>
        </div>
      )}

      {result !== null && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-neutral-500">Result</p>
            <CopyButton text={formatValue(result)} />
          </div>
          <pre className="text-xs font-mono text-neutral-200 whitespace-pre-wrap break-all">
            {formatValue(result)}
          </pre>
        </div>
      )}
    </div>
  );
}
