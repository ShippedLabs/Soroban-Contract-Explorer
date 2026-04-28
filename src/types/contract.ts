export type SorobanType =
  | "U32"
  | "I32"
  | "U64"
  | "I64"
  | "U128"
  | "I128"
  | "Bool"
  | "String"
  | "Symbol"
  | "Bytes"
  | "Address"
  | "Vec"
  | "Option"
  | "Unknown";

export interface FunctionParam {
  name: string;
  type: SorobanType;
  inner?: SorobanType;
}

export interface ContractFunction {
  name: string;
  params: FunctionParam[];
  returnType: SorobanType;
  isReadOnly: boolean;
}

export interface ContractMetadata {
  contractId: string;
  functions: ContractFunction[];
}

export interface InvocationResult {
  success: boolean;
  value?: unknown;
  error?: string;
  txHash?: string;
}
