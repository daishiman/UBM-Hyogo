import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default function DevOnlyLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_PRIMITIVES_HARNESS !== "1") {
    notFound();
  }

  return children;
}
