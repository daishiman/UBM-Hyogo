import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PublicErrorBoundarySmokePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  throw new Error("public-error-boundary-smoke-trigger");
}
