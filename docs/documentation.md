# Soroban Contract Explorer Documentation

This document explains what the Soroban Contract Explorer does, how it is built, and how to run, configure, and extend it. If you only want to get the app running, jump to [Getting started](#getting-started). If you want to contribute, read this first and then see [contributing.md](contributing.md).

## Table of contents

- [Overview](#overview)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Core modules](#core-modules)
- [Supported Soroban types](#supported-soroban-types)
- [Input formats](#input-formats)
- [Wallet integration](#wallet-integration)
- [Recent contracts](#recent-contracts)
- [Testing](#testing)
- [Building for production](#building-for-production)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)
- [Glossary](#glossary)

## Overview

Soroban Contract Explorer is a web application for interacting with any deployed Soroban smart contract on Stellar, without writing code or using the command line. You paste a contract ID, the app reads the contract from the network, parses its interface, and renders a form for every callable function.

There are two ways to call a function:

- **Simulate** runs a read-only simulation of the call. It does not change on-chain state and does not require a wallet, so it is the fastest way to read a value or check what a call would return.
- **Submit** signs and sends a real transaction through the Freighter wallet. This changes on-chain state and costs fees.

The project is intentionally narrow in scope. It is not a Soroban IDE: it does not compile or deploy contracts. It is meant to be the closest thing to an "Etherscan Read/Write tab" for Soroban.

## How it works

When you load a contract, the app performs the following steps:

1. **Validate the contract ID.** The ID must match the Stellar contract format (a `C` followed by 55 base-32 characters).
2. **Fetch the contract instance.** The app asks the Soroban RPC server for the contract's instance ledger entry to find which WASM hash backs it.
3. **Fetch the WASM.** Using that hash, the app downloads the contract's compiled WASM code from the network.
4. **Read the spec.** The WASM includes a custom section named `contractspecv0`. The app reads this section, decodes the XDR spec entries, and extracts every function along with its parameter names and types.
5. **Render forms.** Each function becomes a selectable item. Selecting one renders a form with one input per parameter, typed to the parameter's Soroban type.
6. **Call.** On Simulate, the app builds a transaction, runs it through the RPC `simulateTransaction` endpoint, and decodes the return value. On Submit, the app prepares the transaction, asks Freighter to sign it, sends it, then polls for the result.

All network reads go through the Soroban RPC server. No backend of our own is involved; the browser talks directly to public Stellar infrastructure.

## Project structure

```
soroban-contract-explorer/
  docs/
    documentation.md        This file
    contributing.md         Contributor guide
    screenshot.png          README screenshot
  src/
    app/
      layout.tsx            Root layout and metadata
      page.tsx              Main page: wires search, list, form, results, wallet
      globals.css           Global Tailwind styles
    components/
      contract-search.tsx   Contract ID input and search button
      recent-contracts.tsx  List of recently loaded contract IDs
      function-list.tsx      List of a contract's callable functions
      function-form.tsx      Per-function input form with validation
      tx-result.tsx          Renders call results, errors, and tx hashes
      wallet-connect.tsx     Freighter connect/disconnect and network badge
    hooks/
      use-contract.ts        Loads metadata and tracks the selected function
      use-wallet.ts          Tracks Freighter connection, address, and network
    lib/
      stellar-client.ts      Configures the Soroban RPC server and network
      contract-parser.ts     Fetches WASM and extracts the contract spec
      invocation.ts          Encodes args, simulates, and submits calls
      validation.ts          Validates the contract ID format
      validators.ts          Per-type input validation for function params
      recent-contracts.ts    Reads and writes recent contracts in localStorage
    types/
      contract.ts            Shared types for functions, params, and metadata
      stellar-js-xdr.d.ts    Type shim for the js-xdr reader
  tests/                     Test files
  .env.example               Sample environment configuration
```

## Getting started

### Prerequisites

- Node.js 18 or newer and npm.
- A modern browser.
- The [Freighter](https://www.freighter.app/) browser extension, if you want to submit transactions. Simulation alone does not need a wallet.

### Install and run

```bash
npm install
cp .env.example .env
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

To try it without deploying anything, paste the ID of any contract already deployed on testnet, select a read-only function such as a getter, fill in any inputs, and click **Simulate**.

## Configuration

Configuration is read from environment variables prefixed with `NEXT_PUBLIC_` so they are available in the browser. Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` | Selects the network. Any value other than `mainnet` is treated as testnet. |
| `NEXT_PUBLIC_HORIZON_URL` | `https://horizon-testnet.stellar.org` | Horizon endpoint for the chosen network. |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint used for all reads and submissions. |

The network passphrase is derived automatically from `NEXT_PUBLIC_STELLAR_NETWORK`. When the value is `mainnet`, the app uses the public network passphrase; otherwise it uses the testnet passphrase.

Note: the default build targets testnet. Mainnet support is configurable through these variables, but the app has been built and tested against testnet, so treat mainnet use as experimental.

## Core modules

### stellar-client.ts

Creates the single shared Soroban RPC server instance and exposes the active network name and passphrase. Every other module imports the server from here so there is one source of truth for network configuration.

### contract-parser.ts

Responsible for turning a contract ID into a structured list of functions:

- `fetchContractWasm(contractId)` reads the contract instance ledger entry, confirms the contract is backed by WASM, then fetches and returns the WASM code as a buffer.
- `loadContractMetadata(contractId)` is the public entry point. It fetches the WASM, extracts the `contractspecv0` custom section, decodes the XDR spec entries, and maps each function spec into a `ContractFunction`.

If the contract is not found on the configured network, or if it is not a WASM contract, this module throws a descriptive error that the UI surfaces to the user.

### invocation.ts

Handles everything related to calling a function:

- `argsFromValues(params, values)` converts the string values typed into the form into Soroban `ScVal` values, using each parameter's declared type.
- `simulateCall(...)` builds a transaction and runs it through the RPC simulation endpoint. It uses the connected wallet address as the source account when available, or a random key otherwise, since simulation does not require a signature.
- `invokeCall(...)` prepares a transaction, requests a signature from Freighter, submits it, and polls `getTransaction` until the result is final or a timeout is reached. It returns the transaction hash and the decoded return value.

### validators.ts and validation.ts

`validation.ts` checks that a contract ID matches the expected `C` plus 55 base-32 characters format before any network call is made.

`validators.ts` validates the value typed for each function parameter against its Soroban type. It enforces numeric ranges per integer width, checks address and contract ID formats, requires even-length hexadecimal for byte inputs, restricts symbols to letters, numbers, and underscores up to 32 characters, and recurses into the inner type for `Vec` and `Option`. Validation runs on change in the form so errors appear inline, and Simulate and Submit stay disabled while any field is invalid.

### recent-contracts.ts

Persists the last loaded contract IDs in `localStorage` under the key `soroban-explorer:recent-contracts`, keeping at most 10 entries with the most recent first. It exposes helpers to read, add, remove, and clear entries, and it guards every access so it is safe to call during server rendering where `window` is not defined.

## Supported Soroban types

The parser maps the following Soroban spec types into form inputs:

| Soroban type | Notes |
| --- | --- |
| `U32`, `I32` | 32-bit integers, range-checked. |
| `U64`, `I64` | 64-bit integers, parsed as big integers. |
| `U128`, `I128` | 128-bit integers, parsed as big integers. |
| `Bool` | Accepts `true` or `false`. |
| `String` | Arbitrary UTF-8 string. |
| `Symbol` | Letters, numbers, and underscores, up to 32 characters. |
| `Bytes`, `BytesN` | Hexadecimal string with an even number of characters. |
| `Address` | A Stellar account (`G...`) or contract (`C...`). |
| `Vec` | A comma-separated list of the inner type. |
| `Option` | The inner type, or empty for none. |

Any spec type the parser does not recognize is mapped to `Unknown`. Unknown inputs are not validated and may not encode correctly, so functions using them are best avoided for now.

## Input formats

Because every input is a text field, a few types use conventions worth knowing:

- **Booleans:** type `true` or `false` (case-insensitive).
- **Bytes:** type a hexadecimal string such as `deadbeef`. The length must be even because each byte is two hex characters.
- **Addresses:** paste a full account public key starting with `G` or a contract ID starting with `C`.
- **Vec:** separate items with commas, for example `1, 2, 3`. Each item is validated and encoded using the vector's inner type. Whitespace around items is trimmed and empty items are ignored.
- **Option:** leave the field empty to pass "none." Provide a value to pass "some," encoded with the inner type.

## Wallet integration

Wallet support is provided by Freighter through `@stellar/freighter-api` and is managed by the `use-wallet` hook.

- On load, the app checks whether Freighter is installed and whether the site is already authorized. If so, it reads the public key and network without prompting.
- Clicking connect calls `requestAccess`, which prompts the user in Freighter and returns the public key on approval.
- The app reads the wallet's current network and compares it with the app's configured network. If they differ, a warning banner appears and asks the user to switch networks in Freighter before submitting.
- Disconnecting clears the address and network from local state. Freighter itself remains installed and authorized; this only resets the app's view of the connection.

Simulation never requires a wallet. A wallet is required only to submit a state-changing transaction, because that step needs a signature.

## Recent contracts

Every successfully loaded contract ID is saved to the recent list. The list is shown below the search box so you can reload a contract with one click. Entries are stored only in your browser via `localStorage`, are capped at 10, and can be removed individually. Nothing is sent to any server.

## Testing

Tests are run with Jest:

```bash
npm test
```

Test files live in the `tests/` directory. Pure logic modules such as `validators.ts`, `validation.ts`, `recent-contracts.ts`, and the argument encoding in `invocation.ts` are the most valuable to cover because they have clear inputs and outputs and do not depend on the network. See [contributing.md](contributing.md) for guidance on what to test when you change these modules.

## Building for production

```bash
npm run build
npm run start
```

`npm run build` produces an optimized Next.js build, and `npm run start` serves it. The app is a static, client-rendered Next.js application with no server of its own, so it can be hosted on any platform that serves a Next.js build. The live demo is deployed on Vercel.

## Troubleshooting

**"Contract not found on this network."** The contract ID is valid in format but does not exist on the configured network. Confirm you are pointed at the right network and that the contract is deployed there. Remember the default build targets testnet.

**"Contract is not a WASM contract."** The address resolves to something that is not a standard WASM contract, so there is no spec to read.

**"No contract spec found in WASM."** The contract was compiled without the `contractspecv0` section. Without the spec, the app cannot list functions or types.

**Freighter not detected.** Install the extension from [freighter.app](https://www.freighter.app/) and reload the page.

**Network mismatch warning.** Your wallet is on a different network than the app. Switch networks inside Freighter, then try again.

**A transaction fails after submitting.** The RPC may report the call as failed, or polling may time out after roughly 30 seconds. The error text from the network is shown in the result panel. Re-running a Simulate first often reveals the underlying reason.

## Limitations

- Testnet is the supported and tested target. Mainnet is configurable but experimental.
- Complex Soroban types such as `Map`, structs, enums, and tuples are not yet supported.
- There are no shareable direct contract URLs yet.
- Functions are not distinguished as read-only versus state-changing from the spec; the choice between Simulate and Submit is left to the user.

These items are tracked as issues and are open for contribution. See [contributing.md](contributing.md).

## Glossary

- **Soroban:** the smart contract platform on the Stellar network.
- **Contract ID:** the on-chain identifier of a deployed contract, formatted as `C` followed by 55 base-32 characters.
- **WASM:** the compiled WebAssembly code that backs a contract.
- **Contract spec:** the machine-readable interface embedded in the WASM that lists functions and their types.
- **ScVal:** the Soroban value type used to encode arguments and return values on chain.
- **Simulation:** a read-only execution of a call that returns a value without changing state or paying fees.
- **Freighter:** the Stellar browser wallet used to sign and submit transactions.
