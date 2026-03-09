"use client";

import { UploadButton } from "@/app/utils/uploadthing";
import { useState } from "react";
import type { UploadThingError } from "@uploadthing/shared";
import { addToHistory } from "@/app/utils/history";

const SITE_NAME = "fupload";
const TAGLINE = "Drop a file. Get a shareable link.";
const ALLOWED_DESCRIPTION = "One file.";

function getFriendlyErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("invalid token") ||
    lower.includes("base64") ||
    lower.includes("apikey") ||
    lower.includes("appid") ||
    lower.includes("missing_env") ||
    lower.includes("configuration") ||
    lower.includes("unauthorized")
  ) {
    return "Upload isn't available right now. Please try again later or contact the site owner.";
  }
  if (lower.includes("too large") || lower.includes("file size") || lower.includes("maxfilesize")) {
    return "File is too large. Try a smaller file (images/PDF up to 4MB, video 16MB, audio 8MB).";
  }
  if (lower.includes("file type") || lower.includes("not allowed") || lower.includes("invalid type")) {
    return "This file type isn't supported. Use images, video, audio, PDF, or text.";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to fetch")) {
    return "Connection problem. Check your internet and try again.";
  }
  if (lower.includes("500") || lower.includes("internal server error")) {
    return "Upload isn't available right now. Please try again later or contact the site owner.";
  }
  return raw.length > 120 ? "Something went wrong. Please try again." : raw;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUploadComplete = (res: { ufsUrl?: string; name?: string }[] | undefined) => {
    setError(null);
    const file = res?.[0];
    if (file?.ufsUrl) {
      setUrl(file.ufsUrl);
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 2400);
      addToHistory(file.ufsUrl, file.name ?? "Untitled");
    }
  };

  const handleUploadError = (err: UploadThingError<{ message?: string; code?: string }>) => {
    const raw = err.data?.message ?? err.message ?? "Upload failed.";
    setError(getFriendlyErrorMessage(raw));
    setUrl("");
  };

  const buttonContent = ({
    ready,
    isUploading,
    uploadProgress,
  }: {
    ready: boolean;
    isUploading: boolean;
    uploadProgress: number;
  }) => {
    if (!ready) return "Loading…";
    if (isUploading) return uploadProgress >= 100 ? "Finishing…" : `${Math.round(uploadProgress)}%`;
    return "Choose file";
  };

  return (
    <main className="h-screen sm:min-h-screen flex flex-col bg-[var(--page-bg)] overflow-hidden sm:overflow-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-16">
        <header className="w-full max-w-[420px] text-center mb-6 sm:mb-10">
          <h1 className="font-pixel text-[40px] sm:text-[80px] md:text-[112px] font-medium text-[var(--fg)] tracking-tight mb-2 leading-none">
            {SITE_NAME}
          </h1>
          <p className="text-[13px] text-[var(--muted)] leading-relaxed">
            {TAGLINE}
          </p>
        </header>

          <div className="w-full max-w-[420px] flex flex-col items-center mb-6">
          <div className="w-full p-6 sm:p-10 flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px] transition-colors">
            <UploadButton
              endpoint="fileUploader"
              appearance={{
                container: "flex flex-col items-center gap-2",
                allowedContent: "text-[11px] text-[var(--muted)]",
              }}
              content={{
                button: buttonContent,
                allowedContent: () => ALLOWED_DESCRIPTION,
              }}
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              onUploadBegin={() => setError(null)}
            />
          </div>

          {error && (
            <div
              className="mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/30 px-4 py-3 text-[13px] text-amber-900 dark:text-amber-200 animate-fade-in"
              role="alert"
            >
              {error}
            </div>
          )}

          {url && !error && (
            <div className="mt-4 w-full min-w-0 flex flex-col gap-3">
              <div
                className={
                  "w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 overflow-hidden " +
                  (justUploaded ? "ring-1 ring-[var(--fg)]/10" : "")
                }
              >
                <span
                  className="text-[12px] text-[var(--muted)] truncate block min-w-0 w-full"
                  title={url}
                >
                  {url}
                </span>
              </div>
              <button
                type="button"
                onClick={copy}
                className="text-[12px] font-medium text-[var(--fg)] py-2 px-6 min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--border)]/50 active:bg-[var(--border)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--fg)]/20"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}

          {justUploaded && !error && (
            <p className="mt-3 text-[11px] text-[var(--muted)] animate-fade-in">
              Done. Copy the link above to share.
            </p>
          )}

          {!url && !error && (
            <a
              href="/history"
              className="mt-6 text-[12px] text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
            >
              View upload history
            </a>
          )}
        </div>
      </div>

      <footer className="py-6 px-4 text-center pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <span className="text-[11px] text-[var(--muted)]">
          powered by{" "}
          <a
            href="https://uploadthing.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-500 underline hover:text-red-600 transition-colors"
          >
            uploadthing
          </a>
        </span>
      </footer>
    </main>
  );
}
