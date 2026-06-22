export interface RecentContract {
  id: string;
  nickname?: string;
}

const STORAGE_KEY = "soroban-explorer:recent-contracts";
const MAX_ENTRIES = 10;

export function getRecentContracts(): RecentContract[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    return parsed.map(v => {
      if (typeof v === "string") {
        return { id: v };
      }
      if (v && typeof v === "object" && typeof v.id === "string") {
        return { id: v.id, nickname: typeof v.nickname === "string" ? v.nickname : undefined };
      }
      return null;
    }).filter((v): v is RecentContract => v !== null);
  } catch {
    return [];
  }
}

export function addRecentContract(id: string, nickname?: string): RecentContract[] {
  if (typeof window === "undefined") return [];
  const current = getRecentContracts();
  const existing = current.find(c => c.id === id);
  const filtered = current.filter((c) => c.id !== id);
  
  const nextItem: RecentContract = { 
    id, 
    nickname: nickname !== undefined ? nickname : existing?.nickname 
  };
  const next = [nextItem, ...filtered].slice(0, MAX_ENTRIES);
  
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage may be full or disabled
  }
  return next;
}

export function removeRecentContract(id: string): RecentContract[] {
  if (typeof window === "undefined") return [];
  const next = getRecentContracts().filter((c) => c.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function updateRecentContractNickname(id: string, nickname: string): RecentContract[] {
  if (typeof window === "undefined") return [];
  const current = getRecentContracts();
  const next = current.map(c => c.id === id ? { ...c, nickname: nickname || undefined } : c);
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
