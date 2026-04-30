"use client";

interface Props {
  address: string | null;
  connecting: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

export function WalletConnect({
  address,
  connecting,
  error,
  onConnect,
  onDisconnect,
}: Props) {
  if (address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-neutral-300">
          {truncate(address)}
        </span>
        <button
          onClick={onDisconnect}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onConnect}
        disabled={connecting}
        className="px-3 py-1.5 bg-neutral-200 text-neutral-900 rounded text-xs font-medium disabled:opacity-50"
      >
        {connecting ? "Connecting..." : "Connect Freighter"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
