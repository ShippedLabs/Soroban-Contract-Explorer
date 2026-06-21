"use client";

import { CopyButton } from "@/components/copy-button";

interface Props {
  result: unknown;
  txHash: string | null;
  error: string | null;
  network?: "testnet" | "mainnet" | null;
}

function formatValue(value: unknown): string {
  return JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2
  );
}


export function TxResult({ result, txHash, error, network }: Props) {
  if (error) {
    return (
      <div className="border border-red-900 bg-red-950/30 rounded p-3 text-xs text-red-300 break-all">
        {error}
      </div>
    );
  }

  if (result === null && !txHash) return null;

  const explorerPath = network === "mainnet" ? "public" : "testnet";
  const explorerUrl = txHash
    ? `https://stellar.expert/explorer/${explorerPath}/tx/${txHash}`
    : null;

  return (
    <div className="border border-neutral-800 rounded p-3 bg-neutral-950 flex flex-col gap-3">
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
