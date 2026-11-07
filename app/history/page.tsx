"use client";

import { useState } from "react";
import Link from "next/link";
import { getUploadHistory, removeFromHistory, clearHistory } from "@/app/utils/history";

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

function isImage(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTS.includes(ext);
}

function Preview({ url, filename }: { url: string; filename: string }) {
  if (isImage(filename)) {
    return (
      <img
        src={url}
        alt={filename}
        className="w-12 h-12 object-cover rounded border border-[var(--border)]"
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded border border-[var(--border)] bg-[var(--page-bg)] flex items-center justify-center">
      <span className="text-[10px] text-[var(--muted)] lowercase">
        {filename.slice(filename.lastIndexOf(".") + 1).slice(0, 3)}
      </span>
    </div>
  );
}

export default function History() {
  const [records] = useState<{ url: string; filename: string; timestamp: number }[]>(() => {
    if (typeof window === "undefined") return [];
    return getUploadHistory();
  });
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const remove = (url: string) => {
    removeFromHistory(url);
    window.location.reload();
  };

  const clear = () => {
    if (confirm("clear all history?")) {
      clearHistory();
      window.location.reload();
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString().toLowerCase();
  };

  return (
    <main className="min-h-screen flex flex-col bg-[var(--page-bg)]">
      <header className="py-8 px-4 text-center border-b border-[var(--border)]">
        <h1 className="text-[28px] font-medium tracking-[-0.04em] text-[var(--fg)] sm:text-[32px]">history</h1>
        <p className="text-[13px] text-[var(--muted)] mt-1">stored locally in your browser</p>
      </header>

      <div className="flex-1 px-4 py-6 max-w-[600px] mx-auto w-full">
        {records.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] text-[var(--muted)]">no uploads yet</p>
            <Link href="/" className="mt-2 inline-block text-[13px] text-[var(--danger)] hover:underline">
              go to upload
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={clear}
                className="text-[12px] text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
              >
                clear all
              </button>
            </div>

            <ul className="space-y-3">
              {records.map((record) => (
                <li
                  key={record.url}
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
                >
                  <div className="flex items-start gap-3">
                    <a href={record.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <Preview url={record.url} filename={record.filename} />
                    </a>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[var(--fg)] truncate" title={record.filename}>
                        {record.filename}
                      </p>
                      <p className="text-[11px] text-[var(--muted)] truncate mt-1" title={record.url}>
                        {record.url}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] mt-2">
                        {formatDate(record.timestamp)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => copy(record.url)}
                        className="text-[11px] px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--page-bg)] hover:bg-[var(--border)]/50 transition-colors"
                      >
                        {copied === record.url ? "copied" : "copy"}
                      </button>
                      <button
                        onClick={() => remove(record.url)}
                        className="rounded border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--danger)] transition-colors hover:bg-[var(--danger-bg)]"
                      >
                        delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <footer className="py-6 px-4 text-center">
        <Link href="/" className="text-[12px] text-[var(--muted)] hover:underline">
          ← back to upload
        </Link>
      </footer>
    </main>
  );
}
