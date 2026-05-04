"use client";

import { useState, useEffect } from "react";
import { ContractSearch } from "@/components/contract-search";
import { FunctionList } from "@/components/function-list";
import { FunctionForm } from "@/components/function-form";
import { RecentContracts } from "@/components/recent-contracts";
import { TxResult } from "@/components/tx-result";
import { WalletConnect } from "@/components/wallet-connect";
import { useContract } from "@/hooks/use-contract";
import { useWallet } from "@/hooks/use-wallet";
import { argsFromValues, invokeCall, simulateCall } from "@/lib/invocation";
import {
  addRecentContract,
  getRecentContracts,
  removeRecentContract,
} from "@/lib/recent-contracts";
import { appNetwork } from "@/lib/stellar-client";

export default function Home() {
  const {
    metadata,
    loading,
    error,
    selectedName,
    selectedFunction,
    selectFunction,
    load,
  } = useContract();

  const wallet = useWallet();

  const [callLoading, setCallLoading] = useState(false);
  const [callResult, setCallResult] = useState<unknown>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    setRecents(getRecentContracts());
  }, []);

  useEffect(() => {
    if (metadata?.contractId) {
      setRecents(addRecentContract(metadata.contractId));
    }
  }, [metadata?.contractId]);

  const handleRemoveRecent = (id: string) => {
    setRecents(removeRecentContract(id));
  };

  const resetCallState = () => {
    setCallResult(null);
    setCallError(null);
    setTxHash(null);
  };

  const handleSimulate = async (values: Record<string, string>) => {
    if (!metadata || !selectedFunction) return;

    setCallLoading(true);
    resetCallState();

    try {
      const args = argsFromValues(selectedFunction.params, values);
      const result = await simulateCall(
        metadata.contractId,
        selectedFunction.name,
        args,
        wallet.address ?? undefined
      );
      setCallResult(result);
    } catch (err) {
      setCallError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setCallLoading(false);
    }
  };

  const handleInvoke = async (values: Record<string, string>) => {
    if (!metadata || !selectedFunction || !wallet.address) return;

    setCallLoading(true);
    resetCallState();

    try {
      const args = argsFromValues(selectedFunction.params, values);
      const { txHash: hash, value } = await invokeCall(
        metadata.contractId,
        selectedFunction.name,
        args,
        wallet.address
      );
      setTxHash(hash);
      setCallResult(value);
    } catch (err) {
      setCallError(err instanceof Error ? err.message : "Invocation failed");
    } finally {
      setCallLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1">
              Soroban Contract Explorer
            </h1>
            <p className="text-sm text-neutral-400">
              Paste a contract ID to view and call its functions.
            </p>
          </div>
          <WalletConnect
            address={wallet.address}
            network={wallet.network}
            connecting={wallet.connecting}
            error={wallet.error}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
          />
        </header>

        {wallet.address &&
          wallet.network &&
          wallet.network !== appNetwork && (
            <div className="mb-6 border border-yellow-900 bg-yellow-950/30 rounded p-3 text-xs text-yellow-200">
              Your wallet is on{" "}
              <span className="capitalize font-medium">{wallet.network}</span>{" "}
              but this app is configured for{" "}
              <span className="capitalize font-medium">{appNetwork}</span>.
              Switch networks in Freighter before submitting transactions.
            </div>
          )}

        <section className="mb-8 flex flex-col gap-4">
          <ContractSearch onSearch={load} loading={loading} />
          <RecentContracts
            contracts={recents}
            onSelect={load}
            onRemove={handleRemoveRecent}
          />
        </section>

        <section>
          {error && <p className="text-sm text-red-400">{error}</p>}

          {!error && !metadata && !loading && (
            <p className="text-sm text-neutral-500">No contract loaded yet.</p>
          )}

          {metadata && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-neutral-500 mb-3 font-mono break-all">
                  {metadata.contractId}
                </p>
                <FunctionList
                  functions={metadata.functions}
                  selected={selectedName}
                  onSelect={selectFunction}
                />
              </div>

              <div className="flex flex-col gap-4">
                {selectedFunction ? (
                  <FunctionForm
                    fn={selectedFunction}
                    walletConnected={!!wallet.address}
                    loading={callLoading}
                    onSimulate={handleSimulate}
                    onInvoke={handleInvoke}
                  />
                ) : (
                  <p className="text-sm text-neutral-500">
                    Select a function to view its inputs.
                  </p>
                )}

                <TxResult
                  result={callResult}
                  txHash={txHash}
                  error={callError}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
