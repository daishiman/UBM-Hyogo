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

  if (name === "parallel-02-css-rules") {
    return (
      <VisualShell>
        <div style={{ display: "grid", gap: 28 }}>
          <section style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button type="button" data-component="tag-pill" data-evidence="tag-pill-default">
              #kobe
            </button>
            <button
              type="button"
              data-component="tag-pill"
              data-evidence="tag-pill-selected"
              aria-selected="true"
            >
              #startup
            </button>
            <button type="button" data-component="tag-pill" data-evidence="tag-pill-hover">
              #mentor
            </button>
          </section>

          <section style={{ display: "grid", gap: 12 }}>
            <article
              data-component="member-card"
              data-evidence="member-card-default"
              style={{ border: "1px solid var(--ubm-color-border-default)", borderRadius: "var(--ubm-radius-md)", padding: 16 }}
            >
              <a href="/members/sample-001">佐藤 サンプル</a>
              <p style={{ margin: "8px 0 0", color: "var(--ubm-color-text-secondary)" }}>事業開発 / Kobe</p>
            </article>
            <article
              data-component="member-card"
              data-evidence="member-card-hover"
              style={{ border: "1px solid var(--ubm-color-border-default)", borderRadius: "var(--ubm-radius-md)", padding: 16 }}
            >
              <a href="/members/sample-002">田中 サンプル</a>
              <p style={{ margin: "8px 0 0", color: "var(--ubm-color-text-secondary)" }}>地域連携 / Himeji</p>
            </article>
            <article
              data-component="member-card"
              data-evidence="member-card-focus"
              style={{ border: "1px solid var(--ubm-color-border-default)", borderRadius: "var(--ubm-radius-md)", padding: 16 }}
            >
              <a href="/members/sample-003">山田 サンプル</a>
              <p style={{ margin: "8px 0 0", color: "var(--ubm-color-text-secondary)" }}>教育 / Akashi</p>
            </article>
          </section>

          <section style={{ display: "grid", gap: 10 }}>
            <p data-visibility="public" data-evidence="visibility-public">
              公開プロフィール
            </p>
            <p data-visibility="member" data-evidence="visibility-member">
              会員限定メモ
            </p>
            <p data-visibility="admin" data-evidence="visibility-admin">
              管理者確認項目
            </p>
          </section>
        </div>
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
