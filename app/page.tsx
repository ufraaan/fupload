"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { UploadThingError } from "@uploadthing/shared";
import { useUploadThing } from "@/app/utils/uploadthing";
import { addToHistory } from "@/app/utils/history";
import { getFileLimitError } from "@/app/utils/file-validation";

type Toast = { kind: "success" | "error"; message: string };

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (["invalid token", "base64", "apikey", "appid", "missing_env", "configuration", "unauthorized", "500"].some((s) => lower.includes(s))) return "uploads are temporarily unavailable. try again shortly.";
  if (["too large", "file size", "maxfilesize"].some((s) => lower.includes(s))) return "that file is too large. try a smaller file.";
  if (["file type", "not allowed", "invalid type"].some((s) => lower.includes(s))) return "that file type isn’t supported.";
  if (["network", "fetch", "failed to report event"].some((s) => lower.includes(s))) return "connection problem. check your internet and try again.";
  return raw.length > 120 ? "something went wrong. please try again." : raw.toLowerCase();
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const copyTimeout = useRef<number | null>(null);
  const toastTimeout = useRef<number | null>(null);
  const showToast = useCallback((message: string, kind: Toast["kind"], duration = 3000) => {
    setToast({ message, kind });
    if (toastTimeout.current !== null) window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(null), duration);
  }, []);
  const { startUpload, isUploading } = useUploadThing("fileUploader", {
    uploadProgressGranularity: "fine",
    onUploadBegin: () => setProgress(0),
    onUploadProgress: (value) => setProgress(Math.min(value, 99)),
    onClientUploadComplete: (files) => {
      const file = files?.[0];
      setProgress(null);
      if (!file?.ufsUrl) return;
      setUrl(file.ufsUrl);
      addToHistory(file.ufsUrl, file.name ?? "Untitled");
    },
    onUploadError: (err: UploadThingError<{ message?: string }>) => {
      setProgress(null);
      showToast(friendlyError(err.data?.message ?? err.message ?? "upload failed."), "error");
    },
  });

  const upload = useCallback((files: File[]) => {
    if (!files.length || isUploading) return;
    const file = files[0];
    const limitError = getFileLimitError(file);
    if (limitError) {
      showToast(limitError, "error");
      return;
    }
    setToast(null);
    if (toastTimeout.current !== null) window.clearTimeout(toastTimeout.current);
    setUrl("");
    setProgress(null);
    void startUpload([files[0]]).catch((err: unknown) => {
      setProgress(null);
      showToast(friendlyError(err instanceof Error ? err.message : "upload failed."), "error");
    });
  }, [isUploading, showToast, startUpload]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || (active instanceof HTMLElement && active.isContentEditable)) return;
      const file = Array.from(event.clipboardData?.items ?? []).find((item) => item.kind === "file")?.getAsFile();
      if (file) {
        event.preventDefault();
        upload([file]);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [upload]);

  useEffect(() => () => {
    if (copyTimeout.current !== null) window.clearTimeout(copyTimeout.current);
    if (toastTimeout.current !== null) window.clearTimeout(toastTimeout.current);
  }, []);

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    if (copyTimeout.current !== null) window.clearTimeout(copyTimeout.current);
    copyTimeout.current = window.setTimeout(() => setCopied(false), 2000);
    showToast("copied!", "success", 2000);
  };

  return (
    <main className="upload-shell flex min-h-screen min-h-[100svh] flex-col bg-[var(--page-bg)] px-5 py-6 sm:py-8">
      <div className="upload-content mx-auto flex w-full max-w-[400px] flex-1 flex-col sm:px-2">
        <header className="upload-header entrance-header flex shrink-0 items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-[-0.04em]">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3.5 2C3.22386 2 3 2.22386 3 2.5V13.5C3 13.6818 3.09864 13.8492 3.25762 13.9373C3.41659 14.0254 3.61087 14.0203 3.765 13.924L7.5 11.5896L11.235 13.924C11.3891 14.0203 11.5834 14.0254 11.7424 13.9373C11.9014 13.8492 12 13.6818 12 13.5V2.5C12 2.22386 11.7761 2 11.5 2H3.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
            </svg>
            <span>fupload</span>
          </Link>
          <Link href="/history" className="text-[11px] text-[var(--muted)] underline underline-offset-2 transition-colors hover:text-[var(--fg)]">history</Link>
        </header>

        <div className="entrance-main my-auto w-full py-6">
          <h1 className="mb-6 text-center text-[21px] font-medium tracking-[-0.04em]">upload a file, get a link</h1>

          <section
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
            onDrop={(event) => { event.preventDefault(); setDragging(false); upload(Array.from(event.dataTransfer.files)); }}
            className={`rounded-md border border-dashed px-4 py-5 text-center transition-[border-color,background-color] duration-150 ${dragging ? "border-[var(--fg)] bg-[var(--hover)]" : "border-[var(--border)]"}`}
          >
            <p className="text-[13px] font-medium">drop or paste a file</p>
            <div className="mt-4 flex justify-center">
              <input ref={fileInput} type="file" className="sr-only" disabled={isUploading} onChange={(event) => { upload(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }} />
              <button type="button" disabled={isUploading} onClick={() => fileInput.current?.click()} className="min-h-8 cursor-pointer rounded border border-[var(--border)] bg-[var(--control-bg)] px-3 text-[12px] font-medium text-[var(--fg)] transition-colors duration-150 hover:bg-[var(--hover)] active:bg-[var(--control-active)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60">
                <span className="flex items-center gap-1.5">
                  {!isUploading && (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M7.81825 1.18188C7.64251 1.00615 7.35759 1.00615 7.18185 1.18188L4.18185 4.18188C4.00611 4.35762 4.00611 4.64254 4.18185 4.81828C4.35759 4.99401 4.64251 4.99401 4.81825 4.81828L7.05005 2.58648V9.49996C7.05005 9.74849 7.25152 9.94996 7.50005 9.94996C7.74858 9.94996 7.95005 9.74849 7.95005 9.49996V2.58648L10.1819 4.81828C10.3576 4.99401 10.6425 4.99401 10.8182 4.81828C10.994 4.64254 10.994 4.35762 10.8182 4.18188L7.81825 1.18188ZM2.5 9.99997C2.77614 9.99997 3 10.2238 3 10.5V12C3 12.5538 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2238 12.2239 9.99997 12.5 9.99997C12.7761 9.99997 13 10.2238 13 10.5V12C13 13.104 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2238 2.22386 9.99997 2.5 9.99997Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                    </svg>
                  )}
                  {isUploading ? "uploading…" : "choose file"}
                </span>
              </button>
            </div>
          </section>

          {isUploading && (
            <div className="mt-4 animate-[fade-in_160ms_ease-out]" aria-live="polite">
              <div className="mb-2 flex justify-between text-[12px] text-[var(--muted)]"><span>{progress === null ? "preparing upload" : "uploading"}</span>{progress !== null && <span>{Math.round(progress)}%</span>}</div>
              <div
                className="h-1 overflow-hidden rounded-full bg-[var(--border)]"
                role="progressbar"
                aria-label={progress === null ? "preparing upload" : "uploading file"}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress === null ? undefined : Math.round(progress)}
                aria-busy="true"
              >
                {progress === null ? (
                  <div className="h-full w-[32%] animate-[upload-indeterminate_1.2s_ease-in-out_infinite] rounded-full bg-[#0d6efd]" />
                ) : (
                  <div className="h-full rounded-full bg-[#0d6efd] transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
                )}
              </div>
            </div>
          )}
          {url && (
            <div className="mt-5 min-w-0 animate-[fade-in_160ms_ease-out]">
              <label className="mb-2 block text-[12px] font-medium text-[var(--fg)]" htmlFor="share-link">your link</label>
              <div className="flex min-w-0 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] p-1.5 pl-3">
                <a id="share-link" href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-[12px] text-[var(--muted)] underline decoration-transparent underline-offset-2 transition-colors hover:text-[var(--fg)] hover:decoration-current" title={url}>{url}</a>
                <button type="button" onClick={copy} aria-label={copied ? "copied link" : "copy link"} title={copied ? "copied" : "copy link"} className="flex size-8 shrink-0 cursor-copy items-center justify-center rounded border border-[var(--border)] bg-[var(--control-bg)] text-[var(--fg)] transition-colors hover:bg-[var(--hover)] active:bg-[var(--control-active)] focus-visible:outline-2 focus-visible:outline-offset-2">
                  <span className="copy-icon-wrap" aria-hidden="true">
                    <svg className={`copy-icon ${copied ? "copy-icon--hidden" : ""}`} width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                    </svg>
                    <svg className={`copy-icon copy-icon--check ${copied ? "copy-icon--visible" : ""}`} width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 7.5L6.1 10.5L12 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="upload-footer entrance-footer shrink-0 border-t border-[var(--border)] pt-3">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] leading-4 text-[var(--muted)]" aria-label="file size limits">
            <span>images + pdf 4 mb</span><span aria-hidden="true">·</span>
            <span>video 16 mb</span><span aria-hidden="true">·</span>
            <span>audio 8 mb</span><span aria-hidden="true">·</span>
            <span>text 1 mb</span><span aria-hidden="true">·</span>
            <span>other files 8 mb</span>
          </div>
          <p className="mt-2 text-center text-[9px] text-[var(--muted)]">
            thanks to{" "}
            <a href="https://uploadthing.com/" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">
              uploadthing
            </a>
          </p>
        </footer>
      </div>
      <div data-testid="toast" className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-50 max-w-[calc(100vw-2rem)] rounded-md border px-3 py-2 text-[12px] shadow-lg transition-[opacity,transform] duration-200 ${toast?.kind === "error" ? "border-[var(--danger)]/30 bg-[var(--danger-bg)] text-[var(--danger)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--fg)]"} ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"}`} role={toast?.kind === "error" ? "alert" : "status"} aria-live={toast?.kind === "error" ? "assertive" : "polite"} aria-atomic="true">
        {toast?.message ?? ""}
      </div>
    </main>
  );
}
