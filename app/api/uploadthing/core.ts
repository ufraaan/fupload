import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

function toFriendlyMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("invalid token") ||
    lower.includes("base64") ||
    lower.includes("apikey") ||
    lower.includes("appid") ||
    lower.includes("missing_env") ||
    lower.includes("regions")
  ) {
    return "Upload isn't available right now. Please try again later or contact the site owner.";
  }
  return raw;
}

const f = createUploadthing({
  errorFormatter: (err) => {
    return {
      message: toFriendlyMessage(err.message),
      code: err.code,
    };
  },
});

export const ourFileRouter = {
  fileUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    video: { maxFileSize: "16MB", maxFileCount: 1 },
    audio: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
    text: { maxFileSize: "1MB", maxFileCount: 1 },
    blob: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      return { uploadedBy: "anonymous" };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
