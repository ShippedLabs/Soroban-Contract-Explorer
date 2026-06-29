import { Contract, xdr } from "@stellar/stellar-sdk";
import { XdrReader } from "@stellar/js-xdr";
import { getSorobanServer, type StellarNetwork } from "./stellar-client";
import type {
  ContractFunction,
  ContractMetadata,
  FunctionParam,
  SorobanType,
} from "@/types/contract";

export async function fetchContractWasm(
  contractId: string,
  network: StellarNetwork
): Promise<Buffer> {
  const contract = new Contract(contractId);
  const sorobanServer = getSorobanServer(network);

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
  const wasmModule = await WebAssembly.compile(bytes);
  const sections = WebAssembly.Module.customSections(wasmModule, "contractspecv0");
  if (sections.length === 0) {
    throw new Error("No contract spec found in WASM");
  }

  const reader = new XdrReader(Buffer.from(new Uint8Array(sections[0])));
  const entries: xdr.ScSpecEntry[] = [];

  while (!reader.eof) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entries.push((xdr.ScSpecEntry as any).read(reader));
  }

  return entries;
}

function mapSpecType(
  type: xdr.ScSpecTypeDef,
  entries: xdr.ScSpecEntry[]
): {
  type: SorobanType;
  inner?: SorobanType;
  keyType?: SorobanType;
  valueType?: SorobanType;
  fields?: FunctionParam[];
  variants?: string[];
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
      const inner = mapSpecType(type.vec().elementType(), entries);
      return { type: "Vec", inner: inner.type };
    }
    case "scSpecTypeOption": {
      const inner = mapSpecType(type.option().valueType(), entries);
      return { type: "Option", inner: inner.type };
    }
    case "scSpecTypeMap": {
      const key = mapSpecType(type.map().keyType(), entries);
      const val = mapSpecType(type.map().valueType(), entries);
      return {
        type: "Map",
        keyType: key.type,
        valueType: val.type,
      };
    }
    case "scSpecTypeUdt": {
      const udtName = type.udt().name().toString();
      const udtEntry = entries.find((entry) => {
        const entryName = entry.switch().name;
        if (entryName === "scSpecEntryUdtStructV0") {
          return entry.udtStructV0().name().toString() === udtName;
        }
        if (entryName === "scSpecEntryUdtEnumV0") {
          return entry.udtEnumV0().name().toString() === udtName;
        }
        return false;
      });

      if (!udtEntry) {
        return { type: "Unknown" };
      }

      if (udtEntry.switch().name === "scSpecEntryUdtStructV0") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const structFields = udtEntry.udtStructV0().fields().map((field: any) => {
          const mapped = mapSpecType(field.type(), entries);
          return {
            name: field.name().toString(),
            type: mapped.type,
            inner: mapped.inner,
            keyType: mapped.keyType,
            valueType: mapped.valueType,
            fields: mapped.fields,
            variants: mapped.variants,
          };
        });
        return {
          type: "Struct",
          fields: structFields,
        };
      }

      if (udtEntry.switch().name === "scSpecEntryUdtEnumV0") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cases = udtEntry.udtEnumV0().cases().map((c: any) => c.name().toString());
        return {
          type: "Enum",
          variants: cases,
        };
      }

      return { type: "Unknown" };
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
      const mapped = mapSpecType(input.type(), entries);
      return {
        name: input.name().toString(),
        type: mapped.type,
        inner: mapped.inner,
        keyType: mapped.keyType,
        valueType: mapped.valueType,
        fields: mapped.fields,
        variants: mapped.variants,
      };
    });

    const outputs = fn.outputs();
    const returnType: SorobanType =
      outputs.length > 0 ? mapSpecType(outputs[0], entries).type : "Unknown";

    functions.push({ name, params, returnType, isReadOnly: null });
  }

  return functions;
}

export async function loadContractMetadata(
  contractId: string,
  network: StellarNetwork
): Promise<ContractMetadata> {
  const wasm = await fetchContractWasm(contractId, network);
  const entries = await extractSpecEntries(wasm);
  const functions = extractFunctions(entries);
  return { contractId, functions };
}
