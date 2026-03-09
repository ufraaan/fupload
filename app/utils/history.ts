const STORAGE_KEY = "fupload_history";

export type UploadRecord = {
  url: string;
  filename: string;
  timestamp: number;
};

export function getUploadHistory(): UploadRecord[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addToHistory(url: string, filename: string): void {
  if (typeof window === "undefined") return;
  const history = getUploadHistory();
  history.unshift({ url, filename, timestamp: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function removeFromHistory(url: string): void {
  if (typeof window === "undefined") return;
  const history = getUploadHistory();
  const filtered = history.filter((r) => r.url !== url);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
