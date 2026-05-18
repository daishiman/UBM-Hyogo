import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "UBM Hyogo",
  description: "Runtime foundation for UBM Hyogo",
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
