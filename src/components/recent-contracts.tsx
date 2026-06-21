"use client";

import { useState } from "react";
import type { RecentContract } from "@/lib/recent-contracts";

interface Props {
  contracts: RecentContract[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateNickname: (id: string, nickname: string) => void;
}

function truncate(id: string): string {
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

export function RecentContracts({ contracts, onSelect, onRemove, onUpdateNickname }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  if (contracts.length === 0) return null;

  const handleEdit = (contract: RecentContract) => {
    setEditingId(contract.id);
    setEditValue(contract.nickname || "");
  };

  const handleSave = (id: string) => {
    onUpdateNickname(id, editValue.trim());
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSave(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-neutral-500">Recent</p>
      <div className="flex flex-wrap gap-2">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded text-xs"
          >
            {editingId === contract.id ? (
              <div className="flex items-center px-2 py-1 gap-1">
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, contract.id)}
                  onBlur={() => handleSave(contract.id)}
                  className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded px-1 w-24 text-xs outline-none focus:border-neutral-500"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 group">
                <button
                  onClick={() => onSelect(contract.id)}
                  className="font-mono text-neutral-300 hover:text-neutral-100"
                >
                  {contract.nickname || truncate(contract.id)}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(contract);
                  }}
                  className="text-neutral-500 hover:text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Edit nickname"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
              </div>
            )}
            <button
              onClick={() => onRemove(contract.id)}
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
