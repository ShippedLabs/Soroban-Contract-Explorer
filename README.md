# Soroban Contract Explorer

A no-code web UI for interacting with any deployed Soroban smart contract on the Stellar network.

Enter a contract address, browse its functions, fill in parameters with a form, sign with Freighter wallet, and submit — no CLI or code required.

## Features

- **Contract Lookup** — Paste any Soroban contract ID to load its interface
- **Function Browser** — View all contract functions with parameter types
- **Interactive Forms** — Auto-generated input forms for each function
- **Wallet Integration** — Sign and submit transactions via Freighter
- **Read & Write** — Support for both view (simulate) and state-changing calls
- **Transaction Results** — Clear display of return values and transaction status
- **Testnet & Mainnet** — Network switcher

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Stellar SDK**: `@stellar/stellar-sdk` + Soroban RPC
- **Wallet**: `@stellar/freighter-api`

## Project Structure

```
soroban-contract-explorer/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home / search page
│   │   └── globals.css
│   ├── components/
│   │   ├── contract-search.tsx  # Contract ID input + lookup
│   │   ├── function-list.tsx    # List of contract functions
│   │   ├── function-form.tsx    # Dynamic form for function params
│   │   ├── tx-result.tsx        # Transaction result display
│   │   └── wallet-connect.tsx   # Freighter wallet connection
│   ├── lib/
│   │   ├── stellar-client.ts    # Soroban RPC client setup
│   │   └── contract-parser.ts   # Parse contract spec into typed interface
│   ├── hooks/
│   │   ├── use-contract.ts      # Hook for loading/invoking contracts
│   │   └── use-wallet.ts        # Hook for Freighter wallet state
│   └── types/
│       └── contract.ts          # TypeScript types for contract metadata
├── public/
├── tests/
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── package.json
└── tsconfig.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Copy env config
cp .env.example .env

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

Contributions are welcome! Check the [Issues](../../issues) tab for open tasks.

## License

MIT
