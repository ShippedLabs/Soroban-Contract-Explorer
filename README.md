# Soroban Contract Explorer

A web application for interacting with any Soroban contract function without writing code or using the CLI.

Live demo: https://soroban-contract-explorer.vercel.app/

## Motivation

If you want to call a function on a deployed Soroban contract today, you need to write a script or use the CLI. That works for developers, but it shuts out everyone else, and it is slow even for developers who just want to poke at a contract quickly.

This is not a Soroban IDE. It does not compile or deploy contracts. It only does one thing: load any deployed contract by ID and let you call its functions through a form. The goal is to be the closest thing to "Etherscan Read/Write tab" for Soroban.

## What works today

- Load any deployed Soroban contract by ID on testnet
- Auto-parse the contract spec and list every callable function with its parameter types
- Generate a form per function with input fields for primitive Soroban types (U32, I32, U64, I64, U128, I128, Bool, String, Symbol, Bytes, Address, Vec, Option)
- Simulate read-only calls without a wallet
- Connect Freighter wallet and submit state-changing calls
- Detect a network mismatch between the wallet and the app and warn the user
- Copy results and tx hashes, with a link to view the transaction on Stellar Expert

## Not yet supported

- Mainnet contracts (testnet only for now)
- Complex Soroban types (Map, structs, enums, tuples)
- Saving favorite contracts or recent history
- Direct contract URLs (e.g. /contract/CABCD...) for sharing

These will be tracked as issues in this repo and are open for contribution.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- @stellar/stellar-sdk
- @stellar/freighter-api

## Running it locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000.

## License

MIT
