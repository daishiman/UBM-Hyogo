import { notFound } from "next/navigation";
import { Parallel09VisualScenario } from "./VisualScenarios.client";

export const dynamic = "force-dynamic";

const allowed = new Set([
  "formfield-error",
  "icon-4sizes",
  "breadcrumb",
  "focus-visible",
  "pagination-disabled",
  "empty-state",
  "parallel-02-css-rules",
]);

export default async function Parallel09VisualPage({
  params,
}: {
  readonly params: Promise<{ readonly name: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { name } = await params;
  if (!allowed.has(name)) notFound();
  return <Parallel09VisualScenario name={name} />;
}
