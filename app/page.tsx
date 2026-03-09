"use client";

import { UploadButton } from "@/app/utils/uploadthing";
import { useState } from "react";
import type { UploadThingError } from "@uploadthing/shared";

const ALLOWED_DESCRIPTION = "Image, video, audio, PDF, text. Max 4–16MB. One file.";

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

  const handleUploadComplete = (res: { ufsUrl?: string }[] | undefined) => {
    setError(null);
    if (res?.[0]?.ufsUrl) {
      setUrl(res[0].ufsUrl);
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 2400);
    }
  };

  const handleUploadError = (err: UploadThingError<{ message?: string; code?: string }>) => {
    const message = err.data?.message ?? err.message ?? "Upload failed.";
    setError(message);
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--page-bg)] px-4">
      <div className="w-full max-w-[400px]">
        <h1 className="text-[22px] font-medium text-[var(--fg)] tracking-tight mb-1">
          Upload a file
        </h1>
        <p className="text-[13px] text-[var(--muted)] mb-10">
          Get a shareable link.
        </p>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 flex flex-col items-center justify-center min-h-[160px] transition-colors">
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
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-800 animate-fade-in"
            role="alert"
          >
            {error}
          </div>
        )}

        {url && !error && (
          <div
            className={
              "mt-4 flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition-all duration-300 " +
              (justUploaded ? "ring-1 ring-[var(--fg)]/10" : "")
            }
          >
            <span
              className="text-[12px] text-[var(--muted)] truncate flex-1 min-w-0"
              title={url}
            >
              {url}
            </span>
            <button
              type="button"
              onClick={copy}
              className="text-[12px] font-medium text-[var(--fg)] flex-shrink-0 py-1 px-2 -mr-1 rounded hover:bg-[var(--border)]/50 transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--fg)]/20"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        {justUploaded && !error && (
          <p className="mt-3 text-[11px] text-[var(--muted)] animate-fade-in">
            Uploaded. Copy the link above.
          </p>
        )}
      </div>
    </main>
  );
}
