"use client";

import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { Button, EmptyState, FormField, Icon, Input } from "@/components/ui";
import { Pagination } from "@/components/ui/Pagination";

function VisualShell({ children }: { readonly children: ReactNode }) {
  return (
    <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 32 }}>
      <div style={{ width: "min(680px, 100%)" }}>{children}</div>
    </main>
  );
}

export function Parallel09VisualScenario({ name }: { readonly name: string }) {
  if (name === "formfield-error") {
    return (
      <VisualShell>
        <FormField name="email" label="メール" error="メールアドレスを入力してください" required>
          <Input type="email" defaultValue="" placeholder="name@example.com" />
        </FormField>
      </VisualShell>
    );
  }

  if (name === "icon-4sizes") {
    return (
      <VisualShell>
        <div data-visual="icon-grid" style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {(["sm", "md", "lg", "xl"] as const).map((size) => (
            <span key={size} style={{ display: "grid", justifyItems: "center", gap: 8 }}>
              <Icon name="check" size={size} ariaLabel={`${size} icon`} />
              <span>{size}</span>
            </span>
          ))}
        </div>
      </VisualShell>
    );
  }

  if (name === "breadcrumb") {
    return (
      <VisualShell>
        <Breadcrumb
          items={[
            { label: "管理", href: "/admin" },
            { label: "会員", href: "/admin/members" },
            { label: "詳細" },
          ]}
        />
      </VisualShell>
    );
  }

  if (name === "focus-visible") {
    return (
      <VisualShell>
        <div data-visual="focus-grid" style={{ display: "grid", gap: 16 }}>
          <button type="button" autoFocus>
            Focused button
          </button>
          <a href="/admin">Focused link candidate</a>
          <Input aria-label="Focused input candidate" placeholder="Focused input" />
        </div>
      </VisualShell>
    );
  }

  if (name === "pagination-disabled") {
    return (
      <VisualShell>
        <Pagination current={1} total={30} pageSize={10} hasPrev={false} hasNext onPrev={() => {}} onNext={() => {}} />
      </VisualShell>
    );
  }

  return (
    <VisualShell>
      <EmptyState
        icon={<span>!</span>}
        title="対象がありません"
        description="条件を変えると結果が表示されます。"
        action={<Button variant="primary">条件を変更</Button>}
      />
    </VisualShell>
  );
}
