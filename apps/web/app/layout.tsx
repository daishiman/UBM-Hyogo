import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { buildBaseMetadata } from "@/lib/seo/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildBaseMetadata();
}

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja" data-theme="warm">
      <body data-shell="root">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
