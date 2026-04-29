import { Contract, xdr } from "@stellar/stellar-sdk";
import { sorobanServer } from "./stellar-client";

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
