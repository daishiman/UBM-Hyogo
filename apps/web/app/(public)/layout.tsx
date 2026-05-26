// parallel-03 S-01: Public AppShell。data-theme="warm" / data-shell / data-route 契約。
// プロトタイプ整合: PublicHeader をセッション解決付きの SessionAwarePublicHeader 経由で描画し、
// ログイン中ユーザーには「マイページ」動線を露出する。layout 本体は sync を維持する（テスト互換）。
import type { ReactNode } from "react";

import { PublicFooter } from "../../src/components/public/PublicFooter";
import { SessionAwarePublicHeader } from "../../src/components/public/SessionAwarePublicHeader";

export default function PublicLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div
      className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-theme="warm"
      data-route-group="public"
      data-testid="public-shell"
    >
      <header data-shell="topbar">
        <SessionAwarePublicHeader />
      </header>
      <main data-route="public" data-section-rhythm="comfortable">{children}</main>
      <footer data-shell="footer">
        <PublicFooter />
      </footer>
    </div>
  );
}
