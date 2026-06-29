"use client";
import { CopyButton } from "@/components/copy-button";
import { defaultNetwork } from "@/lib/stellar-client";
import type { InvokeStatus } from "@/types/contract";

interface Props {
  result: unknown;
  txHash: string | null;
  error: string | null;
  network?: "testnet" | "mainnet" | null;
  feeEstimate?: { stroops: string; xlm: string } | null;
  invokeStatus?: InvokeStatus | null;
}

function formatValue(value: unknown): string {
  return JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2
  );
}

const STATUS_CONFIG: Record<InvokeStatus, { label: string; className: string; spin: boolean }> = {
  submitted: { label: "Submitted, waiting for confirmation...", className: "text-yellow-300", spin: true },
  pending: { label: "Confirming on-chain...", className: "text-yellow-300", spin: true },
  confirmed: { label: "Confirmed", className: "text-green-400", spin: false },
  failed: { label: "Failed", className: "text-red-400", spin: false },
};

export function TxResult({ result, txHash, error, network, feeEstimate, invokeStatus }: Props) {
  if (error) {
    return (
      <div className="border border-red-900 bg-red-950/30 rounded p-3 text-xs text-red-300 break-all">
        {error}
      </div>
    );
  }
  if (result === null && !txHash && !feeEstimate && !invokeStatus) return null;

  const activeNetwork = network ?? defaultNetwork;
  const explorerPath = activeNetwork === "mainnet" ? "public" : "testnet";
  const explorerUrl = txHash
    ? `https://stellar.expert/explorer/${explorerPath}/tx/${txHash}`
    : null;

  const statusCfg = invokeStatus ? STATUS_CONFIG[invokeStatus] : null;

  return (
    <div className="border border-neutral-800 rounded p-3 bg-neutral-950 flex flex-col gap-3">
      {statusCfg && (
        <div className="flex items-center gap-2">
          {statusCfg.spin ? (
            <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <div className={`w-2 h-2 rounded-full shrink-0 ${invokeStatus === "confirmed" ? "bg-green-400" : "bg-red-400"}`} />
          )}
          <p className={`text-xs ${statusCfg.className}`}>{statusCfg.label}</p>
        </div>
      )}
      {feeEstimate && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">Estimated fee</p>
          <p className="text-xs font-mono text-neutral-300">
            {feeEstimate.xlm} XLM
            <span className="text-neutral-600 ml-1">({feeEstimate.stroops} stroops)</span>
          </p>
        </div>
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
