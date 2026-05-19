import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../src/styles/tokens.css";
import "../src/styles/globals.css";
import { ToastProvider } from "../src/components/ui/Toast";
import { buildBaseMetadata } from "../src/lib/seo/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildBaseMetadata();
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "oklch(0.99 0.01 95)",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja" data-theme="warm">
      <body data-shell="root">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
