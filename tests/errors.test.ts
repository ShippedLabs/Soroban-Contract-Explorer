import { parseSubmitError, parseTransactionError, parseSimulateError } from "@/lib/invocation";
import { xdr } from "@stellar/stellar-sdk";

// Build minimal duck-typed XDR objects matching what parseSubmitError/parseTransactionError
// actually call: .result().switch().name and .result().results()[n].switch().name
function mockTxResult(topCode: string, opCodes: string[] = []): xdr.TransactionResult {
  return {
    result: () => ({
      switch: () => ({ name: topCode }),
      results: () => opCodes.map((code) => ({ switch: () => ({ name: code }) })),
    }),
  } as unknown as xdr.TransactionResult;
}

// Same shape, but the op result is "opInner" wrapping an invokeHostFunction result
function mockTxResultWithInnerHostFunctionResult(innerCode: string): xdr.TransactionResult {
  return {
    result: () => ({
      switch: () => ({ name: "txFailed" }),
      results: () => [
        {
          switch: () => ({ name: "opInner" }),
          tr: () => ({
            invokeHostFunctionResult: () => ({ switch: () => ({ name: innerCode }) }),
          }),
        },
      ],
    }),
  } as unknown as xdr.TransactionResult;
}

describe("parseSubmitError", () => {
  it("returns fallback when errorResult is undefined", () => {
    expect(parseSubmitError(undefined)).toBe("Transaction rejected by network");
  });

  it("returns human-readable message for txBadAuth", () => {
    expect(parseSubmitError(mockTxResult("txBadAuth"))).toBe("Insufficient or invalid signatures");
  });

  it("returns human-readable message for txInsufficientBalance", () => {
    expect(parseSubmitError(mockTxResult("txInsufficientBalance"))).toBe(
      "Insufficient XLM balance to pay fees"
    );
  });

  it("returns human-readable message for txNoAccount", () => {
    expect(parseSubmitError(mockTxResult("txNoAccount"))).toBe(
      "Source account not found on this network"
    );
  });

  it("falls back for unknown codes", () => {
    expect(parseSubmitError(mockTxResult("txSomeNewCode"))).toBe(
      "Transaction rejected (txSomeNewCode)"
    );
  });

  it("falls back gracefully when result() throws", () => {
    expect(parseSubmitError({} as xdr.TransactionResult)).toBe("Transaction rejected by network");
  });
});

describe("parseTransactionError", () => {
  it("returns human-readable message for a known top-level code", () => {
    expect(parseTransactionError(mockTxResult("txBadAuth"))).toBe(
      "Insufficient or invalid signatures"
    );
  });

  it("returns fallback for unknown top-level code", () => {
    expect(parseTransactionError(mockTxResult("txUnknownNew"))).toBe(
      "Transaction failed (txUnknownNew)"
    );
  });

  it("returns op-level message for txFailed when op results are present", () => {
    expect(parseTransactionError(mockTxResult("txFailed", ["txBadSeq"]))).toBe(
      "Sequence number mismatch, try again"
    );
  });

  it("falls back for txFailed with unknown op code", () => {
    expect(parseTransactionError(mockTxResult("txFailed", ["opNewUnknownCode"]))).toBe(
      "Operation failed (opNewUnknownCode)"
    );
  });

  it("drills into invokeHostFunctionResult for opInner trapped contracts", () => {
    expect(
      parseTransactionError(mockTxResultWithInnerHostFunctionResult("invokeHostFunctionTrapped"))
    ).toBe("Contract execution failed");
  });

  it("drills into invokeHostFunctionResult for resource limit errors", () => {
    expect(
      parseTransactionError(
        mockTxResultWithInnerHostFunctionResult("invokeHostFunctionResourceLimitExceeded")
      )
    ).toBe("Contract exceeded resource limits");
  });

  it("falls back for opInner with unknown invokeHostFunctionResult code", () => {
    expect(
      parseTransactionError(mockTxResultWithInnerHostFunctionResult("invokeHostFunctionNewCode"))
    ).toBe("Operation failed (invokeHostFunctionNewCode)");
  });

  it("returns top-level message for txFailed with no op results", () => {
    expect(parseTransactionError(mockTxResult("txFailed", []))).toBe(
      "Transaction failed on-chain"
    );
  });

  it("falls back gracefully when result() throws", () => {
    expect(parseTransactionError({} as xdr.TransactionResult)).toBe("Transaction failed on-chain");
  });
});

describe("parseSimulateError", () => {
  const CONTRACT_ERROR =
    "HostError: Error(Contract, #14) Event log (newest first): 0: [Diagnostic Event] contract:CD6SSC4OW7T3MUNW7HHQQAYN3LA7UV25L4VBSTFF4EMVT7RHXLGQ6YV7, topics:[error, Error(Contract, #14)], data:\"escalating Ok(ScErrorType::Contract) frame-exit to Err\"";

  it("converts a Contract HostError to a short readable message", () => {
    expect(parseSimulateError(CONTRACT_ERROR)).toBe("Contract error: Check your inputs");
  });

  it("converts an Auth HostError to a permission message", () => {
    const raw = "HostError: Error(Auth, InvalidAction) Event log (newest first): ...";
    expect(parseSimulateError(raw)).toBe(
      "Authorization failed: Your wallet may not have permission to call this function"
    );
  });

  it("converts a Budget HostError to a limits message", () => {
    const raw = "HostError: Error(Budget, ExceededLimit) Event log (newest first): ...";
    expect(parseSimulateError(raw)).toBe("Contract exceeded compute or memory limits");
  });

  it("converts a WasmVm HostError to a generic execution message", () => {
    const raw = "HostError: Error(WasmVm, InvalidAction) Event log (newest first): ...";
    expect(parseSimulateError(raw)).toBe("Contract execution failed (invalid operation)");
  });

  it("uses type:code fallback for unknown HostError types", () => {
    const raw = "HostError: Error(Storage, MissingValue) Event log ...";
    expect(parseSimulateError(raw)).toBe("Contract execution failed (Storage: MissingValue)");
  });

  it("strips event log noise from non-HostError multi-line strings", () => {
    const raw = "Simulation failed: invalid contract ID Event log (newest first): lots of noise";
    expect(parseSimulateError(raw)).toBe("Simulation failed: invalid contract ID");
  });

  it("returns the original string when there is nothing to strip", () => {
    const raw = "Network request timed out";
    expect(parseSimulateError(raw)).toBe("Network request timed out");
  });
});
