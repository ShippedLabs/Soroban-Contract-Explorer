// Tests for invokeCall status transitions, polling timeout, and readable error messages.
// All network and wallet calls are mocked — no live RPC or Freighter required.

import { Account, Keypair, xdr } from "@stellar/stellar-sdk";

jest.mock("@/lib/stellar-client", () => ({
  getSorobanServer: jest.fn(),
  getNetworkPassphrase: () => "Test SDF Network ; September 2015",
}));

jest.mock("@stellar/freighter-api", () => ({
  signTransaction: jest.fn(),
}));

// Imports must come after jest.mock() calls (hoisting)
import { invokeCall } from "@/lib/invocation";
import { getSorobanServer } from "@/lib/stellar-client";
import { signTransaction } from "@stellar/freighter-api";

const CONTRACT_ID = "CD6SSC4OW7T3MUNW7HHQQAYN3LA7UV25L4VBSTFF4EMVT7RHXLGQ6YV7";
const SOURCE = Keypair.random().publicKey();

// Duck-typed TransactionResult — same shape that parseSubmitError/parseTransactionError read
function mockTxResult(topCode: string, opCodes: string[] = []): xdr.TransactionResult {
  return {
    result: () => ({
      switch: () => ({ name: topCode }),
      results: () => opCodes.map((c) => ({ switch: () => ({ name: c }) })),
    }),
  } as unknown as xdr.TransactionResult;
}

function buildMockServer(pollResponses: unknown[]) {
  let pollIndex = 0;
  const server = {
    getAccount: jest.fn().mockResolvedValue(new Account(SOURCE, "0")),
    // prepareTransaction returns the tx unchanged — still a valid parseable XDR envelope
    prepareTransaction: jest.fn().mockImplementation((tx) => Promise.resolve(tx)),
    sendTransaction: jest.fn().mockResolvedValue({ status: "PENDING", hash: "testhash123" }),
    getTransaction: jest.fn().mockImplementation(() => {
      const resp = pollResponses[Math.min(pollIndex, pollResponses.length - 1)];
      pollIndex++;
      return Promise.resolve(resp);
    }),
  };
  (getSorobanServer as jest.Mock).mockReturnValue(server);
  // Return the tx XDR unchanged — TransactionBuilder.fromXDR can parse it without signatures
  (signTransaction as jest.Mock).mockImplementation((xdrStr: string) => Promise.resolve(xdrStr));
  return server;
}

describe("invokeCall: status transitions", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("fires submitted → confirmed when first poll returns SUCCESS", async () => {
    buildMockServer([{ status: "SUCCESS", returnValue: undefined }]);

    const statuses: string[] = [];
    const result = await invokeCall(CONTRACT_ID, "fn", [], SOURCE, "testnet", (s) =>
      statuses.push(s)
    );

    expect(statuses).toEqual(["submitted", "confirmed"]);
    expect(result.txHash).toBe("testhash123");
  });

  it("fires submitted → pending → confirmed after one NOT_FOUND poll", async () => {
    buildMockServer([{ status: "NOT_FOUND" }, { status: "SUCCESS", returnValue: undefined }]);

    const statuses: string[] = [];
    const promise = invokeCall(CONTRACT_ID, "fn", [], SOURCE, "testnet", (s) =>
      statuses.push(s)
    );

    // Advance past the 1 000 ms sleep inside the poll loop
    await jest.advanceTimersByTimeAsync(1100);
    await promise;

    expect(statuses).toEqual(["submitted", "pending", "confirmed"]);
  });

  it("fires submitted → pending × 2 → confirmed after two NOT_FOUND polls", async () => {
    buildMockServer([
      { status: "NOT_FOUND" },
      { status: "NOT_FOUND" },
      { status: "SUCCESS", returnValue: undefined },
    ]);

    const statuses: string[] = [];
    const promise = invokeCall(CONTRACT_ID, "fn", [], SOURCE, "testnet", (s) =>
      statuses.push(s)
    );

    await jest.advanceTimersByTimeAsync(2200);
    await promise;

    expect(statuses).toEqual(["submitted", "pending", "pending", "confirmed"]);
  });
});

describe("invokeCall: polling timeout", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("throws timeout error and fires failed after 30 NOT_FOUND polls", async () => {
    buildMockServer([{ status: "NOT_FOUND" }]); // pinned to NOT_FOUND forever

    const statuses: string[] = [];
    const promise = invokeCall(CONTRACT_ID, "fn", [], SOURCE, "testnet", (s) =>
      statuses.push(s)
    );

    // Attach the rejection handler BEFORE advancing time so the rejection is never "unhandled"
    const rejection = expect(promise).rejects.toThrow("Transaction timed out waiting for confirmation");

    // 30 poll iterations × 1 000 ms each
    await jest.advanceTimersByTimeAsync(31000);
    await rejection;

    expect(statuses[statuses.length - 1]).toBe("failed");
  });
});

describe("invokeCall: readable error messages", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("throws readable error and fires failed when sendTransaction returns ERROR", async () => {
    const server = buildMockServer([]);
    server.sendTransaction.mockResolvedValue({
      status: "ERROR",
      errorResult: mockTxResult("txInsufficientBalance"),
    });

    const statuses: string[] = [];
    await expect(
      invokeCall(CONTRACT_ID, "fn", [], SOURCE, "testnet", (s) => statuses.push(s))
    ).rejects.toThrow("Insufficient XLM balance to pay fees");
    expect(statuses).toEqual(["failed"]);
  });

  it("throws readable error and fires failed when getTransaction returns FAILED", async () => {
    buildMockServer([{ status: "FAILED", resultXdr: mockTxResult("txBadAuth") }]);

    const statuses: string[] = [];
    await expect(
      invokeCall(CONTRACT_ID, "fn", [], SOURCE, "testnet", (s) => statuses.push(s))
    ).rejects.toThrow("Insufficient or invalid signatures");
    expect(statuses).toContain("failed");
  });

  it("uses op-level message when txFailed has inner op results", async () => {
    buildMockServer([
      { status: "FAILED", resultXdr: mockTxResult("txFailed", ["txBadSeq"]) },
    ]);

    await expect(
      invokeCall(CONTRACT_ID, "fn", [], SOURCE, "testnet")
    ).rejects.toThrow("Sequence number mismatch, try again");
  });
});
