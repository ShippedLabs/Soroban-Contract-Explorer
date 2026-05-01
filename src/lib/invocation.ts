import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { networkPassphrase, sorobanServer } from "./stellar-client";
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

export async function simulateCall(
  contractId: string,
  fnName: string,
  args: xdr.ScVal[],
  sourceAddress?: string
): Promise<unknown> {
  const sourceKey = sourceAddress || Keypair.random().publicKey();
  const account = new Account(sourceKey, "0");

  const contract = new Contract(contractId);
  const op = contract.call(fnName, ...args);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const result = await sorobanServer.simulateTransaction(tx);

  if ("error" in result && result.error) {
    throw new Error(result.error);
  }

  if ("result" in result && result.result?.retval) {
    return scValToNative(result.result.retval);
  }

  return null;
}
