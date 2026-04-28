# Soroban Contract Explorer

A web application for interacting with any Soroban contract function without writing code or using the CLI.

## Motivation

Currently if you want to call a function on a deployed Soroban contract, you need to write a script or do it from the CLI. This is why I am building an application that makes interaction easy by just clicking buttons. This will come in handy for both developers and regular Stellar blockchain users.

## Current Status
Early development: Contract lookup and function listing display on testnet.

## Stack
- Next.js
- TypeScript
- Tailwind
- Stellar SDK
- Freighter

## Running it locally
```bash
npm install
cp .env.example .env
npm run dev
```

## License
MIT