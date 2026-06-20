import { rpc, Networks } from "@stellar/stellar-sdk";

export type StellarNetwork = "testnet" | "mainnet";

export const defaultNetwork: StellarNetwork =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";

export function getNetworkPassphrase(network: StellarNetwork): string {
  return network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
}

export function getSorobanServer(network: StellarNetwork): rpc.Server {
  const url =
    network === "mainnet"
      ? (process.env.NEXT_PUBLIC_SOROBAN_MAINNET_RPC_URL || "https://mainnet.sorobanrpc.com")
      : (process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org");

  return new rpc.Server(url, {
    allowHttp: url.startsWith("http://"),
  });
}
