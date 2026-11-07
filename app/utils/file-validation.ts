type FileDetails = Pick<File, "name" | "type" | "size">;

export function getFileLimitError(file: FileDetails): string | null {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  const limit = mime.startsWith("image/")
    ? { mb: 4, label: "images" }
    : mime === "application/pdf" || name.endsWith(".pdf")
      ? { mb: 4, label: "pdf files" }
      : mime.startsWith("video/")
        ? { mb: 16, label: "videos" }
        : mime.startsWith("audio/")
          ? { mb: 8, label: "audio files" }
          : mime.startsWith("text/")
            ? { mb: 1, label: "text files" }
            : { mb: 8, label: "other files" };

  if (file.size <= limit.mb * 1024 * 1024) return null;
  return `that file is too large. the limit for ${limit.label} is ${limit.mb} mb.`;
}
