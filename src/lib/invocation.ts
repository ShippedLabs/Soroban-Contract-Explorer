import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  SorobanDataBuilder,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import { getNetworkPassphrase, getSorobanServer, type StellarNetwork } from "./stellar-client";
import type { FunctionParam, SorobanType } from "@/types/contract";

function valueToScVal(
  value: string,
  type: SorobanType,
  inner?: SorobanType
): xdr.ScVal {
  switch (type) {
    case "U32":
      return nativeToScVal(parseInt(value, 10), { type: "u32" });
    case "I32":
      return nativeToScVal(parseInt(value, 10), { type: "i32" });
    case "U64":
      return nativeToScVal(BigInt(value), { type: "u64" });
    case "I64":
      return nativeToScVal(BigInt(value), { type: "i64" });
    case "U128":
      return nativeToScVal(BigInt(value), { type: "u128" });
    case "I128":
      return nativeToScVal(BigInt(value), { type: "i128" });
    case "Bool":
      return nativeToScVal(value.trim().toLowerCase() === "true", {
        type: "bool",
      });
    case "String":
      return nativeToScVal(value, { type: "string" });
    case "Symbol":
      return nativeToScVal(value, { type: "symbol" });
    case "Bytes":
      return nativeToScVal(Buffer.from(value, "hex"));
    case "Address":
      return new Address(value.trim()).toScVal();
    case "Vec": {
      const items = value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const innerType: SorobanType = inner ?? "Unknown";
      return xdr.ScVal.scvVec(items.map((v) => valueToScVal(v, innerType)));
    }
    case "Option": {
      if (!value.trim()) return xdr.ScVal.scvVoid();
      return valueToScVal(value, inner ?? "Unknown");
    }
    default:
      throw new Error(`Unsupported parameter type: ${type}`);
  }
}

export function argsFromValues(
  params: FunctionParam[],
  values: Record<string, string>
): xdr.ScVal[] {
  return params.map((p) => valueToScVal(values[p.name] ?? "", p.type, p.inner));
}

// Returns dummy ScVal args for primitive-typed params so we can probe read-only status at
// load time without user input. Returns null if any param is a complex type (Struct/Enum/Map)
// that we cannot safely fabricate — those functions stay unresolved until the user simulates.
function dummyScVal(type: SorobanType, contractId: string): xdr.ScVal | null {
  switch (type) {
    case "Address":
      return new Address(contractId).toScVal();
    case "U32":
      return nativeToScVal(0, { type: "u32" });
    case "I32":
      return nativeToScVal(0, { type: "i32" });
    case "U64":
      return nativeToScVal(BigInt(0), { type: "u64" });
    case "I64":
      return nativeToScVal(BigInt(0), { type: "i64" });
    case "U128":
      return nativeToScVal(BigInt(0), { type: "u128" });
    case "I128":
      return nativeToScVal(BigInt(0), { type: "i128" });
    case "Bool":
      return nativeToScVal(false, { type: "bool" });
    case "String":
      return nativeToScVal("", { type: "string" });
    case "Symbol":
      return nativeToScVal("", { type: "symbol" });
    case "Bytes":
      return nativeToScVal(Buffer.alloc(0));
    case "Vec":
      return xdr.ScVal.scvVec([]);
    case "Option":
      return xdr.ScVal.scvVoid();
    case "Struct":
    case "Enum":
    case "Map":
    case "Unknown":
      return null;
    default:
      return null;
  }
}

export function dummyArgsForParams(
  params: FunctionParam[],
  contractId: string
): xdr.ScVal[] | null {
  const result: xdr.ScVal[] = [];
  for (const param of params) {
    const val = dummyScVal(param.type, contractId);
    if (val === null) return null;
    result.push(val);
  }
  return result;
}

export interface SimulateResult {
  value: unknown;
  isReadOnly: boolean;
  minResourceFee: string | null;
}

export function stroopsToXlm(stroops: string): string {
  return (Number(stroops) / 10_000_000).toFixed(7);
}

export function isReadOnlyFromTransactionData(builder: SorobanDataBuilder): boolean {
  return builder.getReadWrite().length === 0;
}

export async function simulateCall(
  contractId: string,
  fnName: string,
  args: xdr.ScVal[],
  sourceAddress: string | undefined,
  network: StellarNetwork
): Promise<SimulateResult> {
  const sorobanServer = getSorobanServer(network);
  const passphrase = getNetworkPassphrase(network);

  const sourceKey = sourceAddress || Keypair.random().publicKey();
  const account = new Account(sourceKey, "0");

  const contract = new Contract(contractId);
  const op = contract.call(fnName, ...args);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const result = await sorobanServer.simulateTransaction(tx);

  if ("error" in result && result.error) {
    throw new Error(result.error);
  }

  const isReadOnly =
    "transactionData" in result && result.transactionData
      ? isReadOnlyFromTransactionData(result.transactionData)
      : false;

  const minResourceFee =
    "minResourceFee" in result && result.minResourceFee
      ? result.minResourceFee
      : null;

  if ("result" in result && result.result?.retval) {
    return { value: scValToNative(result.result.retval), isReadOnly, minResourceFee };
  }

  return { value: null, isReadOnly, minResourceFee };
}

export interface InvokeResult {
  txHash: string;
  value: unknown;
}

export async function invokeCall(
  contractId: string,
  fnName: string,
  args: xdr.ScVal[],
  sourceAddress: string,
  network: StellarNetwork
): Promise<InvokeResult> {
  const sorobanServer = getSorobanServer(network);
  const passphrase = getNetworkPassphrase(network);

  const account = await sorobanServer.getAccount(sourceAddress);

  const contract = new Contract(contractId);
  const op = contract.call(fnName, ...args);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const prepared = await sorobanServer.prepareTransaction(tx);

  const signedXdr = await signTransaction(prepared.toXDR(), {
    networkPassphrase: passphrase,
    accountToSign: sourceAddress,
  });

  const signedTx = TransactionBuilder.fromXDR(signedXdr, passphrase);
  const sendResp = await sorobanServer.sendTransaction(signedTx);

  if (sendResp.status === "ERROR") {
    throw new Error(
      `Submission failed: ${JSON.stringify(sendResp.errorResult)}`
    );
  }

  let getResp = await sorobanServer.getTransaction(sendResp.hash);
  let attempts = 0;
  while (getResp.status === "NOT_FOUND" && attempts < 30) {
    await new Promise((r) => setTimeout(r, 1000));
    getResp = await sorobanServer.getTransaction(sendResp.hash);
    attempts++;
  }

  if (getResp.status !== "SUCCESS") {
    throw new Error(`Transaction ${getResp.status.toLowerCase()}`);
  }

  const value = getResp.returnValue
    ? scValToNative(getResp.returnValue)
    : null;

  return { txHash: sendResp.hash, value };
}
