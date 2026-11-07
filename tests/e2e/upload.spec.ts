import { expect, test } from "@playwright/test";

const MiB = 1024 * 1024;
const supportedFiles = [
  { name: "photo.png", mimeType: "image/png", size: 4 * MiB, limitMessage: "the limit for images is 4 mb." },
  { name: "clip.mp4", mimeType: "video/mp4", size: 16 * MiB, limitMessage: "the limit for videos is 16 mb." },
  { name: "track.mp3", mimeType: "audio/mpeg", size: 8 * MiB, limitMessage: "the limit for audio files is 8 mb." },
  { name: "document.pdf", mimeType: "application/pdf", size: 4 * MiB, limitMessage: "the limit for pdf files is 4 mb." },
  { name: "notes.txt", mimeType: "text/plain", size: 1 * MiB, limitMessage: "the limit for text files is 1 mb." },
  { name: "archive.zip", mimeType: "application/octet-stream", size: 8 * MiB, limitMessage: "the limit for other files is 8 mb." },
];

test("the upload page fits common phone sizes without scrolling and anchors the header and footer", async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 720, height: 540 }, { width: 1024, height: 768 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const bounds = await page.evaluate(() => {
      const main = document.querySelector("main")!;
      const header = document.querySelector(".upload-header")!;
      const footer = document.querySelector(".upload-footer")!;
      return {
        hasVerticalOverflow: main.scrollHeight > main.clientHeight + 1,
        headerTop: header.getBoundingClientRect().top,
        footerBottom: footer.getBoundingClientRect().bottom,
        viewportHeight: window.innerHeight,
      };
    });
    expect(bounds.hasVerticalOverflow, `unexpected scrolling at ${viewport.width}x${viewport.height}`).toBe(false);
    expect(bounds.headerTop).toBeLessThan(100);
    expect(bounds.footerBottom).toBeGreaterThan(bounds.viewportHeight - 100);
  }
});

test("supported file categories at their size limit pass client checks and reach the mocked upload endpoint", async ({ page }) => {
  await page.goto("/");
  let uploadRequestCount = 0;
  await page.route("**/api/uploadthing**", async (route) => {
    uploadRequestCount += 1;
    await route.abort();
  });

  for (const file of supportedFiles) {
    const request = page.waitForRequest((request) => request.url().includes("/api/uploadthing"));
    await page.locator('input[type="file"]').setInputFiles({
      name: file.name,
      mimeType: file.mimeType,
      buffer: Buffer.alloc(file.size),
    });
    await request;
    await expect(page.getByTestId("toast")).toContainText("connection problem");
    await expect(page.getByRole("button", { name: "choose file", exact: true })).toBeEnabled();
  }

  expect(uploadRequestCount).toBe(supportedFiles.length);
});

test("files over each type limit are rejected with a toast before upload", async ({ page }) => {
  await page.goto("/");
  let uploadRequestCount = 0;
  await page.route("**/api/uploadthing**", async (route) => {
    uploadRequestCount += 1;
    await route.abort();
  });

  for (const file of supportedFiles) {
    await page.locator('input[type="file"]').setInputFiles({
      name: file.name,
      mimeType: file.mimeType,
      buffer: Buffer.alloc(file.size + 1),
    });
    await expect(page.getByTestId("toast")).toHaveText(`that file is too large. ${file.limitMessage}`);
  }

  expect(uploadRequestCount).toBe(0);
});

test("system color preference selects the matching theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(10, 10, 10)");
  await expect(page.locator('link[rel="icon"][href="/fupload-icon.svg"]')).toHaveCount(1);
  const favicon = await page.request.get("/fupload-icon.svg");
  expect(await favicon.text()).toContain("prefers-color-scheme: dark");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(255, 255, 255)");
});
