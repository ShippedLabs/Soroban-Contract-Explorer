const STORAGE_KEY = "soroban-explorer:recent-contracts";
const MAX_ENTRIES = 10;

export function getRecentContracts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

export function addRecentContract(id: string): string[] {
  if (typeof window === "undefined") return [];
  const current = getRecentContracts();
  const filtered = current.filter((c) => c !== id);
  const next = [id, ...filtered].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage may be full or disabled
  }
  return next;
}

export function removeRecentContract(id: string): string[] {
  if (typeof window === "undefined") return [];
  const next = getRecentContracts().filter((c) => c !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function clearRecentContracts(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
