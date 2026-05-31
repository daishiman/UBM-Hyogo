"use client";

import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { SidebarUserMenu } from "@/components/shell/SidebarUserMenu";
import { Button, EmptyState, FormField, Icon, Input } from "@/components/ui";
import { Pagination } from "@/components/ui/Pagination";

function VisualShell({ children }: { readonly children: ReactNode }) {
  return (
    <main className="visual-harness-shell">
      <div className="visual-harness-frame">{children}</div>
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
        <div data-visual="icon-grid" className="visual-icon-grid">
          {(["sm", "md", "lg", "xl"] as const).map((size) => (
            <span key={size} className="visual-icon-item">
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
        <div data-visual="focus-grid" className="visual-focus-grid">
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
        <div className="visual-parallel02">
          <section className="visual-tag-row">
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

          <section className="visual-member-card-grid">
            <article
              data-component="member-card"
              data-evidence="member-card-default"
              className="visual-member-card"
            >
              <a href="/members/sample-001">佐藤 サンプル</a>
              <p className="visual-member-card-meta">事業開発 / Kobe</p>
            </article>
            <article
              data-component="member-card"
              data-evidence="member-card-hover"
              className="visual-member-card"
            >
              <a href="/members/sample-002">田中 サンプル</a>
              <p className="visual-member-card-meta">地域連携 / Himeji</p>
            </article>
            <article
              data-component="member-card"
              data-evidence="member-card-focus"
              className="visual-member-card"
            >
              <a href="/members/sample-003">山田 サンプル</a>
              <p className="visual-member-card-meta">教育 / Akashi</p>
            </article>
          </section>

          <section className="visual-visibility-grid">
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

  if (name === "sidebar-user-menu") {
    const memberUser = { displayName: "山田 太郎", email: "taro@example.com", initials: "山" };
    const adminUser = { displayName: "管理者 A", email: "admin@example.com", initials: "管" };

    return (
      <VisualShell>
        <div data-visual="sidebar-user-menu-grid" className="visual-sidebar-user-menu-grid">
          <section data-visual="user-menu-viewer">
            <SidebarUserMenu role="viewer" user={null} collapsed={false} />
          </section>
          <section data-visual="user-menu-member">
            <SidebarUserMenu role="member" user={memberUser} collapsed={false} />
          </section>
          <section data-visual="user-menu-admin">
            <SidebarUserMenu role="admin" user={adminUser} collapsed={false} />
          </section>
          <section data-visual="user-menu-collapsed">
            <SidebarUserMenu role="admin" user={adminUser} collapsed />
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
