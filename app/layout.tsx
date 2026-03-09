import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { GeistMono } from "geist/font/mono";
import { GeistPixelLine } from "geist/font/pixel";
import "./globals.css";

const fontVariables = [GeistMono.variable, GeistPixelLine.variable].join(" ");

export const metadata = {
  title: "Fupload — Drop a file, get a link",
  description:
    "Upload a file and get a shareable link instantly. No sign-up. Images, PDFs, video, audio, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="antialiased font-mono">
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        {children}
      </body>
    </html>
  );
}
