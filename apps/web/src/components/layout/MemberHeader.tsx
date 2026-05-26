// workflow: mypage-prototype-alignment / Phase 5 / ST-6
// 役割: 会員向け global header。brand + nav(マイページ / 公開ページ) + SignOutButton。
// 不変条件: `data-testid="member-header"` を維持（既存テスト互換）。HEX 直書き禁止。

import { SignOutButton } from "../auth/SignOutButton";

export function MemberHeader() {
  return (
    <header className="member-header" data-testid="member-header">
      <span className="brand" aria-label="UBM 兵庫">
        UBM 兵庫
      </span>
      <nav aria-label="member navigation">
        <a href="/profile">マイページ</a>
        <a href="/members">公開ページ</a>
      </nav>
      <SignOutButton />
    </header>
  );
}
