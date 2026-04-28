import { rpc, Networks } from "@stellar/stellar-sdk";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  "https://soroban-testnet.stellar.org";

const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";

export const networkPassphrase =
  NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

export const sorobanServer = new rpc.Server(RPC_URL, {
  allowHttp: RPC_URL.startsWith("http://"),
});
