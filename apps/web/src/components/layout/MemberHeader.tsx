// workflow: mypage-prototype-alignment / Phase 5 / ST-6
// 役割: 会員向け global header。brand + nav(マイページ / 公開ページ) + SignOutButton。
// 不変条件: `data-testid="member-header"` を維持（既存テスト互換）。HEX 直書き禁止。

import { SignOutButton } from "../auth/SignOutButton";
import type { AuthView } from "../../lib/auth-view";

export interface MemberHeaderProps {
  readonly authView?: AuthView;
}

export function MemberHeader({ authView }: MemberHeaderProps = {}) {
  const isAdmin = authView?.kind === "admin";
  return (
    <header
      className="member-header"
      data-testid="member-header"
      data-auth-state={isAdmin ? "admin" : "member"}
    >
      <span className="brand" aria-label="UBM 兵庫">
        UBM 兵庫
      </span>
      <nav aria-label="member navigation">
        <a href="/profile">マイページ</a>
        <a href="/members">公開ページ</a>
        {isAdmin ? (
          <a
            href="/admin"
            data-role="admin-cta"
            aria-label="管理ダッシュボードへ移動"
          >
            管理
          </a>
        ) : null}
      </nav>
      <SignOutButton />
    </header>
  );
}
