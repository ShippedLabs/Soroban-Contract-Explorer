import { rpc, Networks } from "@stellar/stellar-sdk";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  "https://soroban-testnet.stellar.org";

export const appNetwork =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";

export const networkPassphrase =
  appNetwork === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

export const sorobanServer = new rpc.Server(RPC_URL, {
  allowHttp: RPC_URL.startsWith("http://"),
});
