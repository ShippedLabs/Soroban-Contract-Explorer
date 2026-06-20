"use client";

import type { StellarNetwork } from "@/lib/stellar-client";

interface Props {
  network: StellarNetwork;
  onChange: (network: StellarNetwork) => void;
}

export function NetworkToggle({ network, onChange }: Props) {
  return (
    <div className="flex items-center bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-full p-1 relative shadow-inner select-none">
      {/* Sliding active indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-full bg-neutral-800 transition-all duration-300 ease-out shadow-md border border-neutral-700/40"
        style={{
          left: network === "testnet" ? "4px" : "calc(50% + 2px)",
          width: "calc(50% - 6px)",
        }}
      />
      
      <button
        type="button"
        onClick={() => onChange("testnet")}
        className={`relative z-10 px-3 py-1.5 text-[11px] font-semibold tracking-wider rounded-full transition-colors duration-200 uppercase ${
          network === "testnet" ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"
        }`}
        style={{ width: "75px", textAlign: "center" }}
      >
        Testnet
      </button>
      
      <button
        type="button"
        onClick={() => onChange("mainnet")}
        className={`relative z-10 px-3 py-1.5 text-[11px] font-semibold tracking-wider rounded-full transition-colors duration-200 uppercase ${
          network === "mainnet" ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"
        }`}
        style={{ width: "75px", textAlign: "center" }}
      >
        Mainnet
      </button>
    </div>
  );
}
