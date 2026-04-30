import { Contract, xdr } from "@stellar/stellar-sdk";
import { sorobanServer } from "./stellar-client";
import type {
  ContractFunction,
  ContractMetadata,
  FunctionParam,
  SorobanType,
} from "@/types/contract";

export async function fetchContractWasm(contractId: string): Promise<Buffer> {
  const contract = new Contract(contractId);

  const instanceKey = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: contract.address().toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    })
  );

  const instanceResponse = await sorobanServer.getLedgerEntries(instanceKey);
  if (instanceResponse.entries.length === 0) {
    throw new Error("Contract not found on this network");
  }

  const instance = instanceResponse.entries[0].val
    .contractData()
    .val()
    .instance();
  const executable = instance.executable();

  if (executable.switch().name !== "contractExecutableWasm") {
    throw new Error("Contract is not a WASM contract");
  }

  const wasmHash = executable.wasmHash();

  const codeKey = xdr.LedgerKey.contractCode(
    new xdr.LedgerKeyContractCode({ hash: wasmHash })
  );

  const codeResponse = await sorobanServer.getLedgerEntries(codeKey);
  if (codeResponse.entries.length === 0) {
    throw new Error("Contract WASM not found");
  }

  return codeResponse.entries[0].val.contractCode().code();
}

async function extractSpecEntries(
  wasm: Uint8Array
): Promise<xdr.ScSpecEntry[]> {
  const bytes = new Uint8Array(wasm);
  const module = await WebAssembly.compile(bytes);
  const sections = WebAssembly.Module.customSections(module, "contractspecv0");
  if (sections.length === 0) {
    throw new Error("No contract spec found in WASM");
  }

  const entries: xdr.ScSpecEntry[] = [];
  let buffer = Buffer.from(new Uint8Array(sections[0]));

  while (buffer.length > 0) {
    const entry = xdr.ScSpecEntry.fromXDR(buffer);
    entries.push(entry);
    const encoded = entry.toXDR();
    buffer = buffer.subarray(encoded.length);
  }

  return entries;
}

function mapSpecType(type: xdr.ScSpecTypeDef): {
  type: SorobanType;
  inner?: SorobanType;
} {
  switch (type.switch().name) {
    case "scSpecTypeU32":
      return { type: "U32" };
    case "scSpecTypeI32":
      return { type: "I32" };
    case "scSpecTypeU64":
      return { type: "U64" };
    case "scSpecTypeI64":
      return { type: "I64" };
    case "scSpecTypeU128":
      return { type: "U128" };
    case "scSpecTypeI128":
      return { type: "I128" };
    case "scSpecTypeBool":
      return { type: "Bool" };
    case "scSpecTypeString":
      return { type: "String" };
    case "scSpecTypeSymbol":
      return { type: "Symbol" };
    case "scSpecTypeBytes":
    case "scSpecTypeBytesN":
      return { type: "Bytes" };
    case "scSpecTypeAddress":
      return { type: "Address" };
    case "scSpecTypeVec": {
      const inner = mapSpecType(type.vec().elementType());
      return { type: "Vec", inner: inner.type };
    }
    case "scSpecTypeOption": {
      const inner = mapSpecType(type.option().valueType());
      return { type: "Option", inner: inner.type };
    }
    default:
      return { type: "Unknown" };
  }
}

function extractFunctions(entries: xdr.ScSpecEntry[]): ContractFunction[] {
  const functions: ContractFunction[] = [];

  for (const entry of entries) {
    if (entry.switch().name !== "scSpecEntryFunctionV0") continue;

    const fn = entry.functionV0();
    const name = fn.name().toString();

    const params: FunctionParam[] = fn.inputs().map((input) => {
      const mapped = mapSpecType(input.type());
      return {
        name: input.name().toString(),
        type: mapped.type,
        inner: mapped.inner,
      };
    });

    const outputs = fn.outputs();
    const returnType: SorobanType =
      outputs.length > 0 ? mapSpecType(outputs[0]).type : "Unknown";

    functions.push({ name, params, returnType, isReadOnly: false });
  }

  return functions;
}

export async function loadContractMetadata(
  contractId: string
): Promise<ContractMetadata> {
  const wasm = await fetchContractWasm(contractId);
  const entries = await extractSpecEntries(wasm);
  const functions = extractFunctions(entries);
  return { contractId, functions };
}
