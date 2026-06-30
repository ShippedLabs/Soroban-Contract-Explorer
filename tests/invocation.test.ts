import { SorobanDataBuilder, xdr } from "@stellar/stellar-sdk";
import { isReadOnlyFromTransactionData, dummyArgsForParams } from "@/lib/invocation";
import type { FunctionParam } from "@/types/contract";

function makeMutatingKey(): xdr.LedgerKey {
  return xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: xdr.ScAddress.scAddressTypeContract(Buffer.alloc(32)),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    })
  );
}

const DUMMY_CONTRACT_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM";

describe("dummyArgsForParams", () => {
  it("returns empty array for zero-param functions", () => {
    const result = dummyArgsForParams([], DUMMY_CONTRACT_ID);
    expect(result).toEqual([]);
  });

  it("returns null when any param is a Struct type", () => {
    const params: FunctionParam[] = [{ name: "asset", type: "Struct" }];
    expect(dummyArgsForParams(params, DUMMY_CONTRACT_ID)).toBeNull();
  });

  it("returns null when any param is an Enum type", () => {
    const params: FunctionParam[] = [{ name: "side", type: "Enum" }];
    expect(dummyArgsForParams(params, DUMMY_CONTRACT_ID)).toBeNull();
  });

  it("returns null when any param is a Map type", () => {
    const params: FunctionParam[] = [{ name: "data", type: "Map" }];
    expect(dummyArgsForParams(params, DUMMY_CONTRACT_ID)).toBeNull();
  });

  it("returns null when any param is Unknown", () => {
    const params: FunctionParam[] = [{ name: "x", type: "Unknown" }];
    expect(dummyArgsForParams(params, DUMMY_CONTRACT_ID)).toBeNull();
  });

  it("returns an array of ScVal for all primitive types", () => {
    const params: FunctionParam[] = [
      { name: "a", type: "Address" },
      { name: "b", type: "U32" },
      { name: "c", type: "I128" },
      { name: "d", type: "Bool" },
      { name: "e", type: "String" },
      { name: "f", type: "Option" },
    ];
    const result = dummyArgsForParams(params, DUMMY_CONTRACT_ID);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(6);
  });

  it("returns null if a complex type appears alongside primitive types", () => {
    const params: FunctionParam[] = [
      { name: "caller", type: "Address" },
      { name: "asset", type: "Struct" },
    ];
    expect(dummyArgsForParams(params, DUMMY_CONTRACT_ID)).toBeNull();
  });
});

describe("isReadOnlyFromTransactionData", () => {
  it("returns true when readWrite footprint is empty", () => {
    const builder = new SorobanDataBuilder();
    expect(isReadOnlyFromTransactionData(builder)).toBe(true);
  });

  it("returns false when readWrite footprint has entries", () => {
    const builder = new SorobanDataBuilder().setReadWrite([makeMutatingKey()]);
    expect(isReadOnlyFromTransactionData(builder)).toBe(false);
  });

  it("returns true for a builder with only readOnly entries", () => {
    const builder = new SorobanDataBuilder().setReadOnly([makeMutatingKey()]);
    expect(isReadOnlyFromTransactionData(builder)).toBe(true);
  });

  it("returns false when both readOnly and readWrite entries exist", () => {
    const key = makeMutatingKey();
    const builder = new SorobanDataBuilder()
      .setReadOnly([key])
      .setReadWrite([key]);
    expect(isReadOnlyFromTransactionData(builder)).toBe(false);
  });
});
