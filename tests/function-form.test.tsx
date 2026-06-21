import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { FunctionForm } from "@/components/function-form";
import type { ContractFunction } from "@/types/contract";

const base: ContractFunction = {
  name: "get_balance",
  params: [],
  returnType: "U128",
  isReadOnly: null,
};

const noop = () => {};

test("unknown (null) — shows both Simulate and Submit", () => {
  render(
    <FunctionForm
      fn={{ ...base, isReadOnly: null }}
      walletConnected={true}
      loading={false}
      onSimulate={noop}
      onInvoke={noop}
    />
  );
  expect(screen.getByRole("button", { name: /simulate/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
});

test("read-only (true) — shows Simulate, hides Submit", () => {
  render(
    <FunctionForm
      fn={{ ...base, isReadOnly: true }}
      walletConnected={true}
      loading={false}
      onSimulate={noop}
      onInvoke={noop}
    />
  );
  expect(screen.getByRole("button", { name: /simulate/i })).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /submit/i })
  ).not.toBeInTheDocument();
});

test("mutating (false) — shows both Simulate and Submit", () => {
  render(
    <FunctionForm
      fn={{ ...base, isReadOnly: false }}
      walletConnected={true}
      loading={false}
      onSimulate={noop}
      onInvoke={noop}
    />
  );
  expect(screen.getByRole("button", { name: /simulate/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
});
