"use client";

interface Props {
  contracts: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

function truncate(id: string): string {
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

export function RecentContracts({ contracts, onSelect, onRemove }: Props) {
  if (contracts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-neutral-500">Recent</p>
      <div className="flex flex-wrap gap-2">
        {contracts.map((id) => (
          <div
            key={id}
            className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded text-xs"
          >
            <button
              onClick={() => onSelect(id)}
              className="px-2 py-1 font-mono text-neutral-300 hover:text-neutral-100"
            >
              {truncate(id)}
            </button>
            <button
              onClick={() => onRemove(id)}
              className="px-2 py-1 text-neutral-500 hover:text-neutral-300 border-l border-neutral-800"
              aria-label="Remove from recents"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
