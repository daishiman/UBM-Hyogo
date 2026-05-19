import { notFound } from "next/navigation";
import ProfileLoading from "../../profile/loading";
import { Parallel09VisualScenario } from "./VisualScenarios.client";

export const dynamic = "force-dynamic";

const allowed = new Set([
  "formfield-error",
  "icon-4sizes",
  "breadcrumb",
  "focus-visible",
  "pagination-disabled",
  "empty-state",
  "profile-loading",
]);

export default async function Parallel09VisualPage({
  params,
}: {
  readonly params: Promise<{ readonly name: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { name } = await params;
  if (!allowed.has(name)) notFound();
  if (name === "profile-loading") {
    return (
      <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 32 }}>
        <div style={{ width: "min(680px, 100%)" }}>
          <ProfileLoading />
        </div>
      </main>
    );
  }
  return <Parallel09VisualScenario name={name} />;
}
