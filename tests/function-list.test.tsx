import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { FunctionList } from "@/components/function-list";
import type { ContractFunction } from "@/types/contract";

const base: Omit<ContractFunction, "name" | "isReadOnly"> = {
  params: [],
  returnType: "U128",
};

test("read-only (true) — renders view badge", () => {
  render(
    <FunctionList
      functions={[{ ...base, name: "get_balance", isReadOnly: true }]}
      selected={null}
      onSelect={() => {}}
    />
  );
  expect(screen.getByText("view")).toBeInTheDocument();
});

test("mutating (false) — no badge", () => {
  render(
    <FunctionList
      functions={[{ ...base, name: "transfer", isReadOnly: false }]}
      selected={null}
      onSelect={() => {}}
    />
  );
  expect(screen.queryByText("view")).not.toBeInTheDocument();
});

test("unknown (null) — no badge", () => {
  render(
    <FunctionList
      functions={[{ ...base, name: "approve", isReadOnly: null }]}
      selected={null}
      onSelect={() => {}}
    />
  );
  expect(screen.queryByText("view")).not.toBeInTheDocument();
});
