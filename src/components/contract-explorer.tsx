"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ContractSearch } from "@/components/contract-search";
import { FunctionList } from "@/components/function-list";
import { FunctionForm } from "@/components/function-form";
import { RecentContracts } from "@/components/recent-contracts";
import { TxResult } from "@/components/tx-result";
import { WalletConnect } from "@/components/wallet-connect";
import { NetworkToggle } from "@/components/network-toggle";
import { useContract } from "@/hooks/use-contract";
import { useWallet } from "@/hooks/use-wallet";
import { argsFromValues, invokeCall, simulateCall } from "@/lib/invocation";
import {
  addRecentContract,
  getRecentContracts,
  removeRecentContract,
  updateRecentContractNickname,
  type RecentContract,
} from "@/lib/recent-contracts";
import { defaultNetwork, type StellarNetwork } from "@/lib/stellar-client";

interface Props {
  initialContractId?: string;
}

function ContractExplorerInner({ initialContractId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryNetwork = searchParams.get("network");

  const [selectedNetwork, setSelectedNetwork] = useState<StellarNetwork>(defaultNetwork);

  const networkToUse = initialContractId
    ? ((queryNetwork === "mainnet" || queryNetwork === "testnet") ? queryNetwork : defaultNetwork)
    : selectedNetwork;

  const {
    metadata,
    loading,
    error,
    selectedName,
    selectedFunction,
    selectFunction,
    load,
    network: contractNetwork,
  } = useContract();

  const wallet = useWallet();

  const [callLoading, setCallLoading] = useState(false);
  const [callResult, setCallResult] = useState<unknown>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentContract[]>([]);

  // Load contract when ID or Network changes
  useEffect(() => {
    if (initialContractId) {
      load(initialContractId, networkToUse);
    }
  }, [initialContractId, networkToUse, load]);

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

  const handleUpdateNickname = (id: string, nickname: string) => {
    setRecents(updateRecentContractNickname(id, nickname));
  };

  const resetCallState = () => {
    setCallResult(null);
    setCallError(null);
    setTxHash(null);
  };

  const handleSimulate = async (values: Record<string, string>) => {
    if (!metadata || !selectedFunction || !contractNetwork) return;

    setCallLoading(true);
    resetCallState();

    try {
      const args = argsFromValues(selectedFunction.params, values);
      const result = await simulateCall(
        metadata.contractId,
        selectedFunction.name,
        args,
        wallet.address ?? undefined,
        contractNetwork
      );
      setCallResult(result);
    } catch (err) {
      setCallError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setCallLoading(false);
    }
  };

  const handleInvoke = async (values: Record<string, string>) => {
    if (!metadata || !selectedFunction || !wallet.address || !contractNetwork) return;

    setCallLoading(true);
    resetCallState();

    try {
      const args = argsFromValues(selectedFunction.params, values);
      const { txHash: hash, value } = await invokeCall(
        metadata.contractId,
        selectedFunction.name,
        args,
        wallet.address,
        contractNetwork
      );
      setTxHash(hash);
      setCallResult(value);
    } catch (err) {
      setCallError(err instanceof Error ? err.message : "Invocation failed");
    } finally {
      setCallLoading(false);
    }
  };

  const handleSearch = (id: string) => {
    if (id === initialContractId) return;
    router.push(`/contract/${id}?network=${networkToUse}`);
  };

  const handleSelectRecent = (id: string) => {
    if (id === initialContractId) return;
    router.push(`/contract/${id}?network=${networkToUse}`);
  };

  const handleNetworkChange = (newNetwork: StellarNetwork) => {
    if (initialContractId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("network", newNetwork);
      router.push(`/contract/${initialContractId}?${params.toString()}`);
    } else {
      setSelectedNetwork(newNetwork);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold mb-1">
              Soroban Contract Explorer
            </h1>
            <p className="text-sm text-neutral-400">
              Paste a contract ID to view and call its functions.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <NetworkToggle network={networkToUse} onChange={handleNetworkChange} />
            <WalletConnect
              address={wallet.address}
              network={wallet.network}
              connecting={wallet.connecting}
              error={wallet.error}
              onConnect={wallet.connect}
              onDisconnect={wallet.disconnect}
            />
          </div>
        </header>

        {wallet.address &&
          wallet.network &&
          contractNetwork &&
          wallet.network !== contractNetwork && (
            <div className="mb-6 border border-yellow-900 bg-yellow-950/30 rounded p-3 text-xs text-yellow-200">
              Your wallet is on{" "}
              <span className="capitalize font-medium">{wallet.network}</span>{" "}
              but this contract is on{" "}
              <span className="capitalize font-medium">{contractNetwork}</span>.
              Switch networks in Freighter before submitting transactions.
            </div>
          )}

        <section className="mb-8 flex flex-col gap-4">
          <ContractSearch onSearch={handleSearch} loading={loading} />
          <RecentContracts
            contracts={recents}
            onSelect={handleSelectRecent}
            onRemove={handleRemoveRecent}
            onUpdateNickname={handleUpdateNickname}
          />
        </section>

        <section>
          {error && <p className="text-sm text-red-400">{error}</p>}

          {!error && !metadata && !loading && (
            <p className="text-sm text-neutral-500">No contract loaded yet.</p>
          )}

          {loading && (
            <div className="flex flex-col justify-center items-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-200 rounded-full animate-spin"></div>
              <span className="text-sm text-neutral-400">Loading contract metadata...</span>
            </div>
          )}

          {!loading && metadata && (
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
                  network={contractNetwork}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export function ContractExplorer({ initialContractId }: Props) {
  return (
    <Suspense fallback={
      <div className="min-h-screen px-6 py-10 flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-200 rounded-full animate-spin"></div>
        <span className="text-sm text-neutral-400">Loading...</span>
      </div>
    }>
      <ContractExplorerInner initialContractId={initialContractId} />
    </Suspense>
  );
}
