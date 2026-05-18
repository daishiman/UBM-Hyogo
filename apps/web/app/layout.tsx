import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { buildBaseMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildBaseMetadata();

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
