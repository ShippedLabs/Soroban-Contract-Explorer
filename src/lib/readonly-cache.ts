"use client";

const PREFIX = "soroban-explorer:readonly:";

type ReadOnlyMap = Record<string, boolean>;

export function getReadOnlyMap(contractId: string): ReadOnlyMap {
  try {
    const raw = localStorage.getItem(PREFIX + contractId);
    return raw ? (JSON.parse(raw) as ReadOnlyMap) : {};
  } catch {
    return {};
  }
}

export function setReadOnlyEntry(
  contractId: string,
  fnName: string,
  isReadOnly: boolean
): void {
  try {
    const map = getReadOnlyMap(contractId);
    map[fnName] = isReadOnly;
    localStorage.setItem(PREFIX + contractId, JSON.stringify(map));
  } catch {}
}
