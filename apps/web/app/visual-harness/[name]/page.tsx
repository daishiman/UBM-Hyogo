import { notFound } from "next/navigation";
import ProfileLoading from "../../(member)/profile/loading";
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
  "parallel-02-css-rules",
  "sidebar-user-menu",
  "admin-sidebar-spacing-collapsed",
  "admin-sidebar-spacing-expanded",
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
      <main className="visual-harness-shell">
        <div className="visual-harness-frame">
          <ProfileLoading />
        </div>
      </main>
    );
  }
  return <Parallel09VisualScenario name={name} />;
}
