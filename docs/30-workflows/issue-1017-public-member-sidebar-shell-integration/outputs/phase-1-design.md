`[実装区分: 実装仕様書]`

# outputs/phase-1: 設計メモ（issue-1017 / verify_existing）

要点箇条書き（Phase 1 要件定義の補助メモ）。

- **タスク種別**: implementation / `implementation_mode: verify_existing` / VISUAL。issue #1017（CLOSED）= 親 `unified-sidebar-shell-public-and-admin` Task C の formalize。
- **landed 正本**: 実装は commit `278001606`（PR #1028, 2026-05-31 dev マージ）に存在。新規実装ではなく「差分確認 + 回帰確認」を行う。
- **目的**: 公開 6 route（`/`,`/members`,`/register`,`/privacy`,`/terms`,`/login`）+ 会員 `/profile` の shell 所有権を page → layout へ移管し、`SidebarShellServer` を route group layout で 1 度だけ mount。
- **受け入れ条件 4 件**: ①7 route 同一 sidebar shell ②role 別 nav（PUBLIC / +MEMBERS / +ADMIN）③PublicFooter 維持 ④旧 header import 0 件。
- **P50 前提**: current branch に実装 = Yes（→ verify_existing）/ upstream マージ済み = Yes（#1028 dev）/ 前提 A/B/E 完了 = Yes（#1028 同梱）。
- **命名規則**: route group は `(kebab)` / component は PascalCase / 純関数 `buildNavForRole` は camelCase / hook `useSidebarState` / test は `*.spec.tsx`。
- **targeted run**: `(public)/layout.spec.tsx`, `(member)/layout.spec.tsx`, `(public)/page.spec.tsx`, `(member)/profile/page.spec.tsx` の 4 本。
- **不変条件**: 既存 API のみ / D1 直接アクセス禁止 / OKLch `--shell-*` トークン / role 判定は `SidebarShellServer` に閉じる / CONST_007 単一サイクル（Task D/E/F は #1018/#1019 へ分離）。
- **スコープ外**: admin layout 移行（#1018）/ visual baseline CI 化（#1019）/ shell primitive 再実装。
